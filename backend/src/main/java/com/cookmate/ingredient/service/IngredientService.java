package com.cookmate.ingredient.service;

import com.cookmate.ingredient.dto.IngredientRequest;
import com.cookmate.ingredient.dto.IngredientResponse;
import com.cookmate.ingredient.model.Ingredient;
import com.cookmate.ingredient.repository.IngredientRepository;
import com.cookmate.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IngredientService {

    private final IngredientRepository ingredientRepository;

    public IngredientResponse create(IngredientRequest request) {
        Ingredient ingredient = Ingredient.builder()
                .name(request.getName())
                .unitDefault(request.getUnitDefault() != null ? request.getUnitDefault() : "g")
                .category(request.getCategory())
                .build();
        return IngredientResponse.from(ingredientRepository.save(ingredient));
    }

    public List<IngredientResponse> findAll() {
        return ingredientRepository.findAll().stream()
                .map(IngredientResponse::from)
                .collect(Collectors.toList());
    }

    public IngredientResponse findById(String id) {
        return ingredientRepository.findById(id)
                .map(IngredientResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Ingredient", id));
    }

    public List<IngredientResponse> findByCategory(String category) {
        return ingredientRepository.findByCategory(category).stream()
                .map(IngredientResponse::from)
                .collect(Collectors.toList());
    }

    public IngredientResponse update(String id, IngredientRequest request) {
        Ingredient ingredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ingredient", id));
        ingredient.setName(request.getName());
        if (request.getUnitDefault() != null) {
            ingredient.setUnitDefault(request.getUnitDefault());
        }
        if (request.getCategory() != null) {
            ingredient.setCategory(request.getCategory());
        }
        return IngredientResponse.from(ingredientRepository.save(ingredient));
    }

    public void delete(String id) {
        if (!ingredientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Ingredient", id);
        }
        ingredientRepository.deleteById(id);
    }
}
