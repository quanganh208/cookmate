package com.cookmate.recipe.dto;

import com.cookmate.recipe.model.RecipeIngredient;
import com.cookmate.recipe.model.Step;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRecipeRequest {

    private String title;

    private String description;

    private String imageUrl;

    private Integer serving;

    private Integer prepTime;

    private Integer cookTime;

    private String difficulty;

    private String cuisine;

    private String status;

    private String category;

    @Valid
    private List<Step> steps;

    @Valid
    private List<RecipeIngredient> ingredients;
}
