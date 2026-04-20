package com.cookmate.upload;

import com.cookmate.auth.model.User;
import com.cookmate.shared.dto.ApiResponse;
import com.cookmate.shared.exception.RateLimitedException;
import com.cookmate.upload.dto.UploadResponse;
import com.cookmate.upload.model.PendingUpload;
import com.cookmate.upload.repository.PendingUploadRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import javax.imageio.ImageIO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * Image upload proxy → Cloudflare R2.
 *
 * <p>Defence-in-depth:
 *
 * <ul>
 *   <li>Content-based MIME detection via Apache Tika (never trust client {@code Content-Type})
 *   <li>Whitelist {jpeg, png, webp} — SVG permanently excluded (XXE / XSS risk)
 *   <li>{@code ImageIO} round-trip re-encodes the bytes — strips EXIF + metadata, rejects polyglot
 *       files (e.g. a GIF-wrapped PHP payload whose image half decodes but whose script half
 *       survives a byte-identical passthrough)
 *   <li>{@code X-Upload-Id} header idempotency: a retry on the same ID returns the cached URL
 *       without re-uploading (no duplicate R2 objects on network flake)
 *   <li>20 uploads/hour/user via sliding-window rate limiter
 * </ul>
 */
@Slf4j
@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
@Tag(name = "Uploads")
public class UploadController {

    private static final long MAX_BYTES = 5L * 1024 * 1024;

    private static final Set<String> ALLOWED_MIMES =
            Set.of("image/jpeg", "image/png", "image/webp");

    private static final Map<String, String> MIME_TO_EXT =
            Map.of(
                    "image/jpeg", "jpg",
                    "image/png", "png",
                    "image/webp", "webp");

    private static final Map<String, String> MIME_TO_IMAGEIO_FORMAT =
            Map.of(
                    "image/jpeg", "jpg",
                    "image/png", "png",
                    "image/webp",
                            "jpg"); // WebP → re-encode to JPEG (ImageIO default lacks WebP writer)

    private final R2Service r2Service;
    private final PendingUploadRepository pendingUploadRepository;
    private final UploadRateLimiter rateLimiter;
    private final Tika tika = new Tika();

    @PostMapping(value = "/image")
    @Operation(summary = "Upload a recipe image (JPEG / PNG / WebP up to 5MB)")
    public ResponseEntity<ApiResponse<UploadResponse>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-Upload-Id", required = false) String uploadIdHeader,
            @AuthenticationPrincipal User user)
            throws IOException {

        if (!rateLimiter.tryAcquire(user.getId())) {
            throw new RateLimitedException("Too many uploads — please wait an hour");
        }

        String uploadId =
                (uploadIdHeader == null || uploadIdHeader.isBlank())
                        ? UUID.randomUUID().toString()
                        : uploadIdHeader;

        // Idempotency: same uploadId + same user → return cached URL, no second R2 PUT.
        Optional<PendingUpload> cached = pendingUploadRepository.findByUploadId(uploadId);
        if (cached.isPresent() && user.getId().equals(cached.get().getUserId())) {
            return ResponseEntity.ok(
                    ApiResponse.ok(UploadResponse.builder().url(cached.get().getUrl()).build()));
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image exceeds 5MB");
        }

        String detectedMime = detectMime(file);
        if (!ALLOWED_MIMES.contains(detectedMime)) {
            throw new ResponseStatusException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported image type: " + detectedMime);
        }

        byte[] reencoded = reencode(file, detectedMime);
        String objectKey = UUID.randomUUID() + "." + MIME_TO_EXT.get(detectedMime);
        String publicUrl =
                r2Service.putObject(
                        objectKey,
                        new ByteArrayInputStream(reencoded),
                        reencoded.length,
                        detectedMime);

        PendingUpload record =
                PendingUpload.builder()
                        .uploadId(uploadId)
                        .userId(user.getId())
                        .url(publicUrl)
                        .objectKey(objectKey)
                        .uploadedAt(Instant.now())
                        .build();
        pendingUploadRepository.save(record);

        log.info("Upload ok user={} key={} size={}", user.getId(), objectKey, reencoded.length);
        return ResponseEntity.ok(ApiResponse.ok(UploadResponse.builder().url(publicUrl).build()));
    }

    private String detectMime(MultipartFile file) throws IOException {
        try (InputStream is = file.getInputStream()) {
            return tika.detect(is);
        }
    }

    /**
     * Round-trip via {@link ImageIO} to strip EXIF/GPS metadata and defeat polyglot files (e.g.
     * {@code GIF89a<?php ... ?>}): if the bytes survive decode+re-encode at pixel level only, the
     * non-image payload in them is discarded.
     */
    private byte[] reencode(MultipartFile file, String detectedMime) throws IOException {
        BufferedImage img;
        try (InputStream is = file.getInputStream()) {
            img = ImageIO.read(is);
        }
        if (img == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE, "File is not a valid image");
        }
        String format = MIME_TO_IMAGEIO_FORMAT.get(detectedMime);
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            boolean wrote = ImageIO.write(img, format, out);
            if (!wrote) {
                throw new ResponseStatusException(
                        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                        "No ImageIO writer for format: " + format);
            }
            return out.toByteArray();
        }
    }
}
