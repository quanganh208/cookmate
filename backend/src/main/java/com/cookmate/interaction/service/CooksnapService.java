package com.cookmate.interaction.service;

import com.cookmate.auth.dto.UserResponse;
import com.cookmate.auth.repository.UserRepository;
import com.cookmate.interaction.dto.CooksnapRequest;
import com.cookmate.interaction.model.Cooksnap;
import com.cookmate.interaction.model.InteractionResponse;
import com.cookmate.interaction.repository.CooksnapRepository;
import com.cookmate.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CooksnapService {

    private final CooksnapRepository cooksnapRepository;
    private final UserRepository userRepository;

    public InteractionResponse create(String recipeId, CooksnapRequest request, String authorId) {
        Cooksnap cooksnap = Cooksnap.builder()
                .recipeId(recipeId)
                .imageUrl(request.getImageUrl())
                .caption(request.getCaption())
                .authorId(authorId)
                .build();
        cooksnap = cooksnapRepository.save(cooksnap);
        return toResponse(cooksnap);
    }

    public Page<InteractionResponse> findByRecipe(String recipeId, Pageable pageable) {
        return cooksnapRepository.findByRecipeId(recipeId, pageable).map(this::toResponse);
    }

    public Page<InteractionResponse> findByAuthor(String authorId, Pageable pageable) {
        return cooksnapRepository.findByAuthorId(authorId, pageable).map(this::toResponse);
    }

    public void delete(String id, String authorId) {
        Cooksnap cooksnap = cooksnapRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cooksnap", id));
        if (!cooksnap.getAuthorId().equals(authorId)) {
            throw new RuntimeException("Not authorized");
        }
        cooksnapRepository.deleteById(id);
    }

    private InteractionResponse toResponse(Cooksnap cooksnap) {
        InteractionResponse.InteractionResponseBuilder b = InteractionResponse.builder()
                .id(cooksnap.getId())
                .imageUrl(cooksnap.getImageUrl())
                .caption(cooksnap.getCaption())
                .recipeId(cooksnap.getRecipeId())
                .authorId(cooksnap.getAuthorId())
                .createdAt(cooksnap.getCreatedAt())
                .updatedAt(cooksnap.getUpdatedAt());
        userRepository.findById(cooksnap.getAuthorId())
                .ifPresent(u -> b.author(UserResponse.from(u)));
        return b.build();
    }
}
