package com.cookmate.recipe.dto;

import com.cookmate.recipe.model.RecipeIngredient;
import com.cookmate.recipe.model.Step;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRecipeRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    @Size(max = 500)
    private String description;

    /**
     * Must be a URL served by our R2 bucket — validated server-side against {@code r2.public-url}.
     */
    private String imageUrl;

    @PositiveOrZero private Integer serving;

    @PositiveOrZero private Integer prepTime;

    @PositiveOrZero private Integer cookTime;

    @Pattern(
            regexp = "EASY|MEDIUM|HARD|Easy|Medium|Hard",
            message = "Difficulty must be EASY, MEDIUM, or HARD")
    private String difficulty;

    @Size(max = 50)
    private String cuisine;

    @Pattern(
            regexp = "DRAFT|PUBLISHED|ARCHIVED|draft|published|archived",
            message = "Status must be DRAFT, PUBLISHED, or ARCHIVED")
    private String status;

    @Size(max = 50)
    private String category;

    @NotEmpty(message = "At least one step is required")
    @Valid
    private List<Step> steps;

    @NotEmpty(message = "At least one ingredient is required")
    @Valid
    private List<RecipeIngredient> ingredients;
}
