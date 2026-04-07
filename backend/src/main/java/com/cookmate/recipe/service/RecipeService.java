package com.cookmate.recipe.service;

import com.cookmate.auth.model.User;
import com.cookmate.auth.repository.UserRepository;
import com.cookmate.recipe.dto.CreateRecipeRequest;
import com.cookmate.recipe.dto.RecipeResponse;
import com.cookmate.recipe.dto.UpdateRecipeRequest;
import com.cookmate.recipe.model.Recipe;
import com.cookmate.recipe.repository.RecipeRepository;
import com.cookmate.shared.dto.ApiResponse;
import com.cookmate.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final UserRepository userRepository;

    public RecipeResponse create(CreateRecipeRequest request, String authorId) {
        Recipe recipe = Recipe.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .serving(request.getServing())
                .prepTime(request.getPrepTime())
                .cookTime(request.getCookTime())
                .difficulty(request.getDifficulty())
                .cuisine(request.getCuisine())
                .status(request.getStatus() != null
                        ? Recipe.RecipeStatus.valueOf(request.getStatus().toUpperCase())
                        : Recipe.RecipeStatus.DRAFT)
                .category(request.getCategory())
                .authorId(authorId)
                .steps(request.getSteps())
                .ingredients(request.getIngredients())
                .build();
        return RecipeResponse.from(recipeRepository.save(recipe));
    }

    public RecipeResponse findById(String id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", id));
        return RecipeResponse.from(recipe);
    }

    public RecipeResponse findByIdWithAuthor(String id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", id));
        RecipeResponse response = RecipeResponse.from(recipe);
        userRepository.findById(recipe.getAuthorId()).ifPresent(u ->
                response.setAuthor(com.cookmate.auth.dto.UserResponse.from(u)));
        return response;
    }

    public Page<RecipeResponse> findAll(Pageable pageable) {
        return recipeRepository.findAll(pageable).map(RecipeResponse::from);
    }

    public Page<RecipeResponse> findByAuthorId(String authorId, Pageable pageable) {
        return recipeRepository.findByAuthorId(authorId, pageable).map(RecipeResponse::from);
    }

    public Page<RecipeResponse> findPublished(Pageable pageable) {
        return recipeRepository.findByStatus(Recipe.RecipeStatus.PUBLISHED, pageable)
                .map(RecipeResponse::from);
    }

    public Page<RecipeResponse> findByCategory(String category, Pageable pageable) {
        return recipeRepository.findByCategory(category, pageable).map(RecipeResponse::from);
    }

    public Page<RecipeResponse> findFeatured(Pageable pageable) {
        return recipeRepository.findByIsFeaturedTrue(pageable).map(RecipeResponse::from);
    }

    public RecipeResponse update(String id, UpdateRecipeRequest request, String authorId) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", id));
        if (!recipe.getAuthorId().equals(authorId)) {
            throw new RuntimeException("Not authorized to update this recipe");
        }
        if (request.getTitle() != null) recipe.setTitle(request.getTitle());
        if (request.getDescription() != null) recipe.setDescription(request.getDescription());
        if (request.getImageUrl() != null) recipe.setImageUrl(request.getImageUrl());
        if (request.getServing() != null) recipe.setServing(request.getServing());
        if (request.getPrepTime() != null) recipe.setPrepTime(request.getPrepTime());
        if (request.getCookTime() != null) recipe.setCookTime(request.getCookTime());
        if (request.getDifficulty() != null) recipe.setDifficulty(request.getDifficulty());
        if (request.getCuisine() != null) recipe.setCuisine(request.getCuisine());
        if (request.getStatus() != null)
                recipe.setStatus(Recipe.RecipeStatus.valueOf(request.getStatus().toUpperCase()));
        if (request.getCategory() != null) recipe.setCategory(request.getCategory());
        if (request.getSteps() != null) recipe.setSteps(request.getSteps());
        if (request.getIngredients() != null) recipe.setIngredients(request.getIngredients());
        return RecipeResponse.from(recipeRepository.save(recipe));
    }

    public void delete(String id, String authorId) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", id));
        if (!recipe.getAuthorId().equals(authorId)) {
            throw new RuntimeException("Not authorized to delete this recipe");
        }
        recipeRepository.deleteById(id);
    }

    public void incrementViewCount(String id) {
        recipeRepository.findById(id).ifPresent(recipe -> {
            recipe.setViewCount(recipe.getViewCount() + 1);
            recipeRepository.save(recipe);
        });
    }

    public void incrementLikeCount(String id, int delta) {
        recipeRepository.findById(id).ifPresent(recipe -> {
            recipe.setLikeCount(Math.max(0, recipe.getLikeCount() + delta));
            recipeRepository.save(recipe);
        });
    }
}
