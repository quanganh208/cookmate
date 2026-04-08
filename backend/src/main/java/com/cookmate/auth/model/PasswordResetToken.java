package com.cookmate.auth.model;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Password reset token document. MongoDB TTL index auto-cleans expired tokens via {@code
 * expireAfter = "0s"} on {@link #expireAt}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("password_reset_tokens")
public class PasswordResetToken {

    @Id private String id;

    /** SHA-256 hash of the plaintext token; plaintext is never stored. */
    @Indexed(unique = true)
    private String tokenHash;

    @Indexed private String userId;

    /** TTL index removes the document automatically once this instant is reached. */
    @Indexed(expireAfter = "0s")
    private Instant expireAt;

    /** One-time use flag. Set to true after a successful reset. */
    @Builder.Default private boolean used = false;

    @CreatedDate private Instant createdAt;
}
