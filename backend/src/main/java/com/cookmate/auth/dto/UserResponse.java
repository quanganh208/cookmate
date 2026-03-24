package com.cookmate.auth.dto;

import com.cookmate.auth.model.Role;
import com.cookmate.auth.model.User;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private String id;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private String authProvider;
    private Set<String> roles;
    private boolean emailVerified;

    /** Factory method to convert User entity to response DTO. */
    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .authProvider(user.getAuthProvider().name())
                .roles(user.getRoles().stream().map(Role::name).collect(Collectors.toSet()))
                .emailVerified(user.isEmailVerified())
                .build();
    }
}
