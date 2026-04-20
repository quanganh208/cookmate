package com.cookmate.upload;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

/**
 * Thin wrapper over the S3 SDK targeting Cloudflare R2.
 *
 * <p><b>Important</b>: R2 does NOT honour S3 canned ACLs ({@code x-amz-acl}). Public readability is
 * controlled at bucket level via the {@code pub-xxx.r2.dev} subdomain toggle in the Cloudflare
 * dashboard — no ACL param is passed here. Adding one silently does nothing (or in some cases
 * causes the SDK to include a header that R2 rejects).
 *
 * <p>Content-Disposition + X-Content-Type-Options headers are attached as object metadata. Whether
 * R2 propagates these back on GET is bucket-config-dependent; if not, fall back to Cloudflare
 * Transform Rules (documented in deployment-guide.md).
 */
@Slf4j
@Service
public class R2Service {

    private final S3Client s3Client;
    private final String endpoint;
    private final String bucket;
    private final String publicUrl;

    public R2Service(
            S3Client s3Client,
            @Value("${app.r2.endpoint:}") String endpoint,
            @Value("${app.r2.bucket:}") String bucket,
            @Value("${app.r2.public-url:}") String publicUrl) {
        this.s3Client = s3Client;
        this.endpoint = endpoint;
        this.bucket = bucket;
        this.publicUrl = publicUrl;
    }

    @PostConstruct
    void assertConfigured() {
        if (endpoint == null
                || endpoint.isBlank()
                || bucket == null
                || bucket.isBlank()
                || publicUrl == null
                || publicUrl.isBlank()) {
            throw new IllegalStateException(
                    "R2 env vars missing — set R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID,"
                            + " R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL before starting the app.");
        }
    }

    /** Public base URL used by validators / tests — e.g. {@code https://pub-xxx.r2.dev}. */
    public String publicUrl() {
        return publicUrl;
    }

    public String bucket() {
        return bucket;
    }

    /**
     * Upload an object to R2. Returns the public URL (callers never see internal bucket paths).
     * Size + content-type are known at call-site — we don't sniff here.
     */
    public String putObject(String key, InputStream body, long contentLength, String contentType) {
        PutObjectRequest request =
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(contentType)
                        .contentLength(contentLength)
                        // See class javadoc: NO ACL param.
                        .metadata(
                                Map.of(
                                        "content-disposition", "attachment",
                                        "x-content-type-options", "nosniff"))
                        .build();
        s3Client.putObject(request, RequestBody.fromInputStream(body, contentLength));
        return publicUrl + "/" + key;
    }

    /** Delete by object key. Idempotent — swallow not-found. */
    public void deleteObject(String key) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (S3Exception ex) {
            // 404 is benign (recipe delete retry, already cleaned up by janitor, etc.)
            if (ex.statusCode() != 404) {
                log.warn("R2 delete failed for key={}: {}", key, ex.getMessage());
            }
        }
    }

    /**
     * Extract the object key from a public URL produced by {@link #putObject}. Returns {@code null}
     * if the URL doesn't belong to this bucket — callers MUST check and skip R2 deletion for
     * foreign URLs.
     */
    public String extractKey(String url) {
        if (url == null || !url.startsWith(publicUrl + "/")) {
            return null;
        }
        return url.substring(publicUrl.length() + 1);
    }
}
