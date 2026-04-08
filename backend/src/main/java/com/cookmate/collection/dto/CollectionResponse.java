package com.cookmate.collection.dto;

import com.cookmate.collection.model.Collection;
import com.cookmate.collection.model.CollectionEntry;
import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionResponse {

    private String id;
    private String name;
    private String description;
    private String imageUrl;
    private Boolean isPrivate;
    private String authorId;
    private List<CollectionEntry> recipeIds;
    private Integer recipeCount;
    private Instant createdAt;
    private Instant updatedAt;

    public static CollectionResponse from(Collection collection) {
        return CollectionResponse.builder()
                .id(collection.getId())
                .name(collection.getName())
                .description(collection.getDescription())
                .imageUrl(collection.getImageUrl())
                .isPrivate(collection.getIsPrivate())
                .authorId(collection.getAuthorId())
                .recipeIds(collection.getRecipeIds())
                .recipeCount(
                        collection.getRecipeIds() != null ? collection.getRecipeIds().size() : 0)
                .createdAt(collection.getCreatedAt())
                .updatedAt(collection.getUpdatedAt())
                .build();
    }
}
