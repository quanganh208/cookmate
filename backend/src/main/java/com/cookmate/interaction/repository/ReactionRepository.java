package com.cookmate.interaction.repository;

import com.cookmate.interaction.model.Reaction;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReactionRepository extends MongoRepository<Reaction, String> {

    Optional<Reaction> findByRecipeIdAndAuthorId(String recipeId, String authorId);

    List<Reaction> findByRecipeId(String recipeId);

    long countByRecipeId(String recipeId);

    long countByRecipeIdAndType(String recipeId, Reaction.ReactionType type);

    void deleteByRecipeIdAndAuthorId(String recipeId, String authorId);
}
