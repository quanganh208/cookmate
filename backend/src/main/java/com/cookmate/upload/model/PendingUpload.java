package com.cookmate.upload.model;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * One row per successful upload. {@code linkedToRecipeId} is null until the client submits the
 * recipe that uses the URL; rows that stay unlinked past 24h get swept by {@code UploadJanitor}.
 *
 * <p>{@code uploadId} is a client-generated UUID echoed back via {@code X-Upload-Id} header so a
 * network retry can be detected server-side and return the cached URL without a second R2 PUT.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("pending_uploads")
public class PendingUpload {

    @Id private String id;

    @Indexed(unique = true)
    private String uploadId;

    @Indexed private String userId;

    @Indexed private String url;

    /** The R2 object key (separate from URL so the janitor can delete without re-parsing). */
    private String objectKey;

    /** Recipe that claimed this upload. {@code null} until the recipe is created. */
    @Indexed private String linkedToRecipeId;

    /** Used by the janitor cron to find rows older than 24h. */
    private Instant uploadedAt;
}
