package com.cookmate.recipe.dto;

import com.cookmate.auth.dto.UserResponse;
import com.cookmate.recipe.model.Recipe;
import com.cookmate.recipe.model.RecipeIngredient;
import com.cookmate.recipe.model.Step;
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
public class RecipeResponse {

    private String id;
    private String title;
    private String description;
    private String imageUrl;
    private Integer serving;
    private Integer prepTime;
    private Integer cookTime;
    private String difficulty;
    private String cuisine;
    private String status;
    private Long viewCount;
    private Long likeCount;
    private Boolean isFeatured;
    private String authorId;
    private UserResponse author;
    private String category;
    private List<Step> steps;
    private List<RecipeIngredient> ingredients;
    private Instant createdAt;
    private Instant updatedAt;

    public static RecipeResponse from(Recipe recipe) {
        return RecipeResponse.builder()
                .id(recipe.getId())
                .title(recipe.getTitle())
                .description(recipe.getDescription())
                .imageUrl(recipe.getImageUrl())
                .serving(recipe.getServing())
                .prepTime(recipe.getPrepTime())
                .cookTime(recipe.getCookTime())
                .difficulty(recipe.getDifficulty())
                .cuisine(recipe.getCuisine())
                .status(recipe.getStatus() != null ? recipe.getStatus().name() : null)
                .viewCount(recipe.getViewCount())
                .likeCount(recipe.getLikeCount())
                .isFeatured(recipe.getIsFeatured())
                .authorId(recipe.getAuthorId())
                .category(recipe.getCategory())
                .steps(recipe.getSteps())
                .ingredients(recipe.getIngredients())
                .createdAt(recipe.getCreatedAt())
                .updatedAt(recipe.getUpdatedAt())
                .build();
    }
}
