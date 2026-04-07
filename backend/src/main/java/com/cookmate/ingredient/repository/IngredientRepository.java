package com.cookmate.ingredient.repository;

import com.cookmate.ingredient.model.Ingredient;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IngredientRepository extends MongoRepository<Ingredient, String> {

    Optional<Ingredient> findByName(String name);

    List<Ingredient> findByCategory(String category);

    boolean existsByName(String name);
}
