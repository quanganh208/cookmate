package com.cookmate.collection.service;

import com.cookmate.collection.dto.CollectionRequest;
import com.cookmate.collection.dto.CollectionResponse;
import com.cookmate.collection.model.Collection;
import com.cookmate.collection.model.CollectionEntry;
import com.cookmate.collection.repository.CollectionRepository;
import com.cookmate.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionRepository collectionRepository;

    public CollectionResponse create(CollectionRequest request, String authorId) {
        Collection collection = Collection.builder()
                .name(request.getName())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .isPrivate(request.getIsPrivate() != null ? request.getIsPrivate() : false)
                .authorId(authorId)
                .recipeIds(new ArrayList<>())
                .build();
        return CollectionResponse.from(collectionRepository.save(collection));
    }

    public CollectionResponse findById(String id) {
        return collectionRepository.findById(id)
                .map(CollectionResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Collection", id));
    }

    public Page<CollectionResponse> findByAuthorId(String authorId, Pageable pageable) {
        return collectionRepository.findByAuthorId(authorId, pageable)
                .map(CollectionResponse::from);
    }

    public CollectionResponse update(String id, CollectionRequest request, String authorId) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection", id));
        if (!collection.getAuthorId().equals(authorId)) {
            throw new RuntimeException("Not authorized");
        }
        if (request.getName() != null) collection.setName(request.getName());
        if (request.getDescription() != null) collection.setDescription(request.getDescription());
        if (request.getImageUrl() != null) collection.setImageUrl(request.getImageUrl());
        if (request.getIsPrivate() != null) collection.setIsPrivate(request.getIsPrivate());
        return CollectionResponse.from(collectionRepository.save(collection));
    }

    public CollectionResponse addRecipe(String id, String recipeId, String authorId) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection", id));
        if (!collection.getAuthorId().equals(authorId)) {
            throw new RuntimeException("Not authorized");
        }
        if (collection.getRecipeIds() == null) collection.setRecipeIds(new ArrayList<>());
        boolean exists = collection.getRecipeIds().stream()
                .anyMatch(e -> e.getRecipeId().equals(recipeId));
        if (!exists) {
            collection.getRecipeIds().add(CollectionEntry.builder()
                    .recipeId(recipeId)
                    .addedAt(Instant.now())
                    .build());
        }
        return CollectionResponse.from(collectionRepository.save(collection));
    }

    public CollectionResponse removeRecipe(String id, String recipeId, String authorId) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection", id));
        if (!collection.getAuthorId().equals(authorId)) {
            throw new RuntimeException("Not authorized");
        }
        if (collection.getRecipeIds() != null) {
            collection.getRecipeIds().removeIf(e -> e.getRecipeId().equals(recipeId));
        }
        return CollectionResponse.from(collectionRepository.save(collection));
    }

    public void delete(String id, String authorId) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection", id));
        if (!collection.getAuthorId().equals(authorId)) {
            throw new RuntimeException("Not authorized");
        }
        collectionRepository.deleteById(id);
    }
}
