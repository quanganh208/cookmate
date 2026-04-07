package com.cookmate.recipe.dto;

import com.cookmate.recipe.model.RecipeIngredient;
import com.cookmate.recipe.model.Step;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRecipeRequest {

    @NotBlank(message = "Title is required")
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

    @NotEmpty(message = "At least one step is required")
    @Valid
    private List<Step> steps;

    @NotEmpty(message = "At least one ingredient is required")
    @Valid
    private List<RecipeIngredient> ingredients;
}
