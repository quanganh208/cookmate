package com.cookmate.recipe.controller;

import com.cookmate.auth.model.User;
import com.cookmate.recipe.dto.CreateRecipeRequest;
import com.cookmate.recipe.dto.RecipeResponse;
import com.cookmate.recipe.dto.UpdateRecipeRequest;
import com.cookmate.recipe.service.RecipeService;
import com.cookmate.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
@Tag(name = "Recipes")
public class RecipeController {

    private final RecipeService recipeService;

    @PostMapping
    @Operation(summary = "Create a new recipe")
    public ResponseEntity<ApiResponse<RecipeResponse>> create(
            @Valid @RequestBody CreateRecipeRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(recipeService.create(request, user.getId())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get recipe by id")
    public ResponseEntity<ApiResponse<RecipeResponse>> findById(
            @PathVariable String id,
            @RequestParam(name = "view", defaultValue = "true") boolean view) {
        if (view) {
            recipeService.incrementViewCount(id);
        }
        return ResponseEntity.ok(ApiResponse.ok(recipeService.findByIdWithAuthor(id)));
    }

    @GetMapping
    @Operation(summary = "Get all published recipes with pagination")
    public ResponseEntity<ApiResponse<Page<RecipeResponse>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(recipeService.findPublished(pageable)));
    }

    @GetMapping("/author/{authorId}")
    @Operation(summary = "Get recipes by author")
    public ResponseEntity<ApiResponse<Page<RecipeResponse>>> findByAuthor(
            @PathVariable String authorId, @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(recipeService.findByAuthorId(authorId, pageable)));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Get recipes by category")
    public ResponseEntity<ApiResponse<Page<RecipeResponse>>> findByCategory(
            @PathVariable String category, @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(recipeService.findByCategory(category, pageable)));
    }

    @GetMapping("/featured")
    @Operation(summary = "Get featured recipes")
    public ResponseEntity<ApiResponse<Page<RecipeResponse>>> findFeatured(
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(recipeService.findFeatured(pageable)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a recipe")
    public ResponseEntity<ApiResponse<RecipeResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateRecipeRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(recipeService.update(id, request, user.getId())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a recipe")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String id, @AuthenticationPrincipal User user) {
        recipeService.delete(id, user.getId());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
