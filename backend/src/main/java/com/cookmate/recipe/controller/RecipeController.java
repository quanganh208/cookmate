package com.cookmate.recipe.controller;

import com.cookmate.auth.model.User;
import com.cookmate.recipe.dto.CreateRecipeRequest;
import com.cookmate.recipe.dto.RecipeResponse;
import com.cookmate.recipe.dto.UpdateRecipeRequest;
import com.cookmate.recipe.service.RecipeSearchRateLimiter;
import com.cookmate.recipe.service.RecipeService;
import com.cookmate.shared.dto.ApiResponse;
import com.cookmate.shared.exception.RateLimitedException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
@Validated
@Tag(name = "Recipes")
public class RecipeController {

    private final RecipeService recipeService;
    private final RecipeSearchRateLimiter searchRateLimiter;

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

    @GetMapping("/search")
    @Operation(summary = "Full-text search over title and description")
    public ResponseEntity<ApiResponse<Page<RecipeResponse>>> search(
            @RequestParam("q") @NotBlank @Size(min = 1, max = 200) String query,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal User user,
            HttpServletRequest request) {
        String rateKey = user != null ? "u:" + user.getId() : "ip:" + clientIp(request);
        if (!searchRateLimiter.tryAcquire(rateKey)) {
            throw new RateLimitedException("Too many search requests — please slow down");
        }
        return ResponseEntity.ok(ApiResponse.ok(recipeService.searchByText(query, pageable)));
    }

    private static String clientIp(HttpServletRequest request) {
        String fwd = request.getHeader("X-Forwarded-For");
        if (fwd != null && !fwd.isBlank()) {
            return fwd.split(",")[0].trim();
        }
        return request.getRemoteAddr();
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
