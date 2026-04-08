package com.cookmate.interaction.repository;

import com.cookmate.interaction.model.Cooksnap;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CooksnapRepository extends MongoRepository<Cooksnap, String> {

    Page<Cooksnap> findByRecipeId(String recipeId, Pageable pageable);

    Page<Cooksnap> findByAuthorId(String authorId, Pageable pageable);

    long countByRecipeId(String recipeId);
}
