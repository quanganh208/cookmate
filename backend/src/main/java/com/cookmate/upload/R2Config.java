package com.cookmate.upload;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

/**
 * Configures the AWS S3 SDK to target Cloudflare R2. Use path-style addressing (R2 quirk) and
 * {@code us-east-1} as a dummy region (R2 ignores it but the SDK requires a value).
 */
@Configuration
public class R2Config {

    @Bean
    public S3Client r2S3Client(
            @Value("${app.r2.endpoint:}") String endpoint,
            @Value("${app.r2.access-key-id:}") String accessKeyId,
            @Value("${app.r2.secret-access-key:}") String secretAccessKey) {
        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.US_EAST_1)
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
                .serviceConfiguration(
                        S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }
}
