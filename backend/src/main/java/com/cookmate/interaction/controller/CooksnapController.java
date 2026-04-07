package com.cookmate.interaction.controller;

import com.cookmate.auth.model.User;
import com.cookmate.interaction.dto.CooksnapRequest;
import com.cookmate.interaction.model.InteractionResponse;
import com.cookmate.interaction.service.CooksnapService;
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
@RequestMapping("/api/recipes/{recipeId}/cooksnaps")
@RequiredArgsConstructor
@Tag(name = "Cooksnaps")
public class CooksnapController {

    private final CooksnapService cooksnapService;

    @PostMapping
    @Operation(summary = "Upload a cooksnap for a recipe")
    public ResponseEntity<ApiResponse<InteractionResponse>> create(
            @PathVariable String recipeId,
            @Valid @RequestBody CooksnapRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(cooksnapService.create(recipeId, request, user.getId())));
    }

    @GetMapping
    @Operation(summary = "Get all cooksnaps for a recipe")
    public ResponseEntity<ApiResponse<Page<InteractionResponse>>> findByRecipe(
            @PathVariable String recipeId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(cooksnapService.findByRecipe(recipeId, pageable)));
    }

    @GetMapping("/author/{authorId}")
    @Operation(summary = "Get cooksnaps by a user")
    public ResponseEntity<ApiResponse<Page<InteractionResponse>>> findByAuthor(
            @PathVariable String authorId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(cooksnapService.findByAuthor(authorId, pageable)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a cooksnap")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String recipeId,
            @PathVariable String id,
            @AuthenticationPrincipal User user) {
        cooksnapService.delete(id, user.getId());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
