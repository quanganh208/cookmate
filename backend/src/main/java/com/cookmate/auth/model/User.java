package com.cookmate.auth.model;

import java.time.Instant;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("users")
public class User {

    @Id private String id;

    @Indexed(unique = true)
    private String email;

    private String password;

    private String displayName;

    private String avatarUrl;

    private String bio;

    @Builder.Default private AuthProvider authProvider = AuthProvider.LOCAL;

    private String providerId;

    @Builder.Default private Set<Role> roles = Set.of(Role.USER);

    @Builder.Default private boolean emailVerified = false;

    @CreatedDate private Instant createdAt;

    @LastModifiedDate private Instant updatedAt;
}
