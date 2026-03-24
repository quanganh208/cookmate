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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("refresh_tokens")
public class RefreshToken {

    @Id private String id;

    @Indexed(unique = true)
    private String token;

    @Indexed private String userId;

    @Indexed(expireAfter = "0s")
    private Instant expiryDate;

    @Builder.Default private boolean revoked = false;

    @CreatedDate private Instant createdAt;
}
