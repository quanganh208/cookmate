package com.cookmate.recipe.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeIngredient {

    private String ingredientId;

    private String name;

    private Double amount;

    private String unit;

    private String note;
}
