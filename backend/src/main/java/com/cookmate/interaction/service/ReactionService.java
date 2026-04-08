package com.cookmate.interaction.service;

import com.cookmate.interaction.dto.ReactionRequest;
import com.cookmate.interaction.model.InteractionResponse;
import com.cookmate.interaction.model.Reaction;
import com.cookmate.interaction.repository.ReactionRepository;
import com.cookmate.recipe.service.RecipeService;
import com.cookmate.shared.exception.ResourceNotFoundException;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final RecipeService recipeService;

    public InteractionResponse react(String recipeId, ReactionRequest request, String authorId) {
        Reaction reaction =
                reactionRepository.findByRecipeIdAndAuthorId(recipeId, authorId).orElse(null);
        if (reaction != null) {
            recipeService.incrementLikeCount(recipeId, -1);
            reaction.setType(request.getType());
        } else {
            reaction =
                    Reaction.builder()
                            .recipeId(recipeId)
                            .authorId(authorId)
                            .type(request.getType())
                            .build();
        }
        reaction = reactionRepository.save(reaction);
        recipeService.incrementLikeCount(recipeId, 1);
        return toResponse(reaction);
    }

    public void removeReaction(String recipeId, String authorId) {
        Reaction reaction =
                reactionRepository
                        .findByRecipeIdAndAuthorId(recipeId, authorId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Reaction", recipeId + "/" + authorId));
        reactionRepository.delete(reaction);
        recipeService.incrementLikeCount(recipeId, -1);
    }

    public List<InteractionResponse> findByRecipe(String recipeId) {
        return reactionRepository.findByRecipeId(recipeId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public long countByRecipe(String recipeId) {
        return reactionRepository.countByRecipeId(recipeId);
    }

    private InteractionResponse toResponse(Reaction reaction) {
        return InteractionResponse.builder()
                .id(reaction.getId())
                .type(reaction.getType().name())
                .recipeId(reaction.getRecipeId())
                .authorId(reaction.getAuthorId())
                .createdAt(reaction.getCreatedAt())
                .build();
    }
}
