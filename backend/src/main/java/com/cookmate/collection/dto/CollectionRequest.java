package com.cookmate.collection.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionRequest {

    @NotBlank(message = "Collection name is required")
    private String name;

    private String description;

    private String imageUrl;

    private Boolean isPrivate;
}
