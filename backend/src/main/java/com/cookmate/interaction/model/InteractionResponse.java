package com.cookmate.interaction.model;

import com.cookmate.auth.dto.UserResponse;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InteractionResponse {

    private String id;
    private String content;
    private String recipeId;
    private String authorId;
    private UserResponse author;
    private String parentId;
    private String type;
    private String imageUrl;
    private String caption;
    private Instant createdAt;
    private Instant updatedAt;
}
