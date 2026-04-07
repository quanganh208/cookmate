package com.cookmate.ingredient.dto;

import com.cookmate.ingredient.model.Ingredient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientResponse {

    private String id;
    private String name;
    private String unitDefault;
    private String category;
    private Instant createdAt;
    private Instant updatedAt;

    public static IngredientResponse from(Ingredient ingredient) {
        return IngredientResponse.builder()
                .id(ingredient.getId())
                .name(ingredient.getName())
                .unitDefault(ingredient.getUnitDefault())
                .category(ingredient.getCategory())
                .createdAt(ingredient.getCreatedAt())
                .updatedAt(ingredient.getUpdatedAt())
                .build();
    }
}
