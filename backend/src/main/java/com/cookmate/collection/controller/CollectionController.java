package com.cookmate.collection.controller;

import com.cookmate.auth.model.User;
import com.cookmate.collection.dto.CollectionRequest;
import com.cookmate.collection.dto.CollectionResponse;
import com.cookmate.collection.dto.RecipeIdRequest;
import com.cookmate.collection.service.CollectionService;
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
@RequestMapping("/api/collections")
@RequiredArgsConstructor
@Tag(name = "Collections")
public class CollectionController {

    private final CollectionService collectionService;

    @PostMapping
    @Operation(summary = "Create a new collection")
    public ResponseEntity<ApiResponse<CollectionResponse>> create(
            @Valid @RequestBody CollectionRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(collectionService.create(request, user.getId())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get collection by id")
    public ResponseEntity<ApiResponse<CollectionResponse>> findById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(collectionService.findById(id)));
    }

    @GetMapping("/author/{authorId}")
    @Operation(summary = "Get collections by author")
    public ResponseEntity<ApiResponse<Page<CollectionResponse>>> findByAuthor(
            @PathVariable String authorId, @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(
                ApiResponse.ok(collectionService.findByAuthorId(authorId, pageable)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a collection")
    public ResponseEntity<ApiResponse<CollectionResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody CollectionRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                ApiResponse.ok(collectionService.update(id, request, user.getId())));
    }

    @PostMapping("/{id}/recipes")
    @Operation(summary = "Add a recipe to collection")
    public ResponseEntity<ApiResponse<CollectionResponse>> addRecipe(
            @PathVariable String id,
            @Valid @RequestBody RecipeIdRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                ApiResponse.ok(
                        collectionService.addRecipe(id, request.getRecipeId(), user.getId())));
    }

    @DeleteMapping("/{id}/recipes/{recipeId}")
    @Operation(summary = "Remove a recipe from collection")
    public ResponseEntity<ApiResponse<CollectionResponse>> removeRecipe(
            @PathVariable String id,
            @PathVariable String recipeId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                ApiResponse.ok(collectionService.removeRecipe(id, recipeId, user.getId())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a collection")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String id, @AuthenticationPrincipal User user) {
        collectionService.delete(id, user.getId());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
