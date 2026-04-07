package com.cookmate.interaction.controller;

import com.cookmate.auth.model.User;
import com.cookmate.interaction.dto.ReactionRequest;
import com.cookmate.interaction.model.InteractionResponse;
import com.cookmate.interaction.service.ReactionService;
import com.cookmate.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recipes/{recipeId}/reactions")
@RequiredArgsConstructor
@Tag(name = "Reactions")
public class ReactionController {

    private final ReactionService reactionService;

    @PostMapping
    @Operation(summary = "React to a recipe (upsert reaction)")
    public ResponseEntity<ApiResponse<InteractionResponse>> react(
            @PathVariable String recipeId,
            @Valid @RequestBody ReactionRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(
                reactionService.react(recipeId, request, user.getId())));
    }

    @GetMapping
    @Operation(summary = "Get all reactions for a recipe")
    public ResponseEntity<ApiResponse<List<InteractionResponse>>> findByRecipe(
            @PathVariable String recipeId) {
        return ResponseEntity.ok(ApiResponse.ok(reactionService.findByRecipe(recipeId)));
    }

    @DeleteMapping
    @Operation(summary = "Remove reaction from a recipe")
    public ResponseEntity<ApiResponse<Void>> remove(
            @PathVariable String recipeId,
            @AuthenticationPrincipal User user) {
        reactionService.removeReaction(recipeId, user.getId());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
