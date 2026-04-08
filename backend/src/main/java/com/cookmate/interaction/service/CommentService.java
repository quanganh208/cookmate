package com.cookmate.interaction.service;

import com.cookmate.auth.dto.UserResponse;
import com.cookmate.auth.repository.UserRepository;
import com.cookmate.interaction.dto.CommentRequest;
import com.cookmate.interaction.model.Comment;
import com.cookmate.interaction.model.InteractionResponse;
import com.cookmate.interaction.repository.CommentRepository;
import com.cookmate.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    public InteractionResponse create(String recipeId, CommentRequest request, String authorId) {
        Comment comment =
                Comment.builder()
                        .recipeId(recipeId)
                        .content(request.getContent())
                        .authorId(authorId)
                        .parentId(request.getParentId())
                        .build();
        comment = commentRepository.save(comment);
        return toResponse(comment);
    }

    public Page<InteractionResponse> findByRecipe(String recipeId, Pageable pageable) {
        return commentRepository.findByRecipeId(recipeId, pageable).map(this::toResponse);
    }

    public Page<InteractionResponse> findByAuthor(String authorId, Pageable pageable) {
        return commentRepository.findByAuthorId(authorId, pageable).map(this::toResponse);
    }

    public void delete(String id, String authorId) {
        Comment comment =
                commentRepository
                        .findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Comment", id));
        if (!comment.getAuthorId().equals(authorId)) {
            throw new RuntimeException("Not authorized");
        }
        commentRepository.deleteById(id);
    }

    public long countByRecipe(String recipeId) {
        return commentRepository.countByRecipeId(recipeId);
    }

    private InteractionResponse toResponse(Comment comment) {
        InteractionResponse.InteractionResponseBuilder b =
                InteractionResponse.builder()
                        .id(comment.getId())
                        .content(comment.getContent())
                        .recipeId(comment.getRecipeId())
                        .authorId(comment.getAuthorId())
                        .parentId(comment.getParentId())
                        .createdAt(comment.getCreatedAt())
                        .updatedAt(comment.getUpdatedAt());
        userRepository
                .findById(comment.getAuthorId())
                .ifPresent(u -> b.author(UserResponse.from(u)));
        return b.build();
    }
}
