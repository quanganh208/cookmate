package com.cookmate.recipe.repository;

import com.cookmate.recipe.model.Recipe;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecipeRepository extends MongoRepository<Recipe, String>, RecipeRepositoryCustom {

    Page<Recipe> findByAuthorId(String authorId, Pageable pageable);

    Page<Recipe> findByStatus(Recipe.RecipeStatus status, Pageable pageable);

    Page<Recipe> findByCategory(String category, Pageable pageable);

    Page<Recipe> findByStatusAndCategory(
            Recipe.RecipeStatus status, String category, Pageable pageable);

    List<Recipe> findByAuthorId(String authorId);

    Page<Recipe> findByIsFeaturedTrue(Pageable pageable);
}
