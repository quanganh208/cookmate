package com.cookmate.interaction.repository;

import com.cookmate.interaction.model.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {

    Page<Comment> findByRecipeId(String recipeId, Pageable pageable);

    Page<Comment> findByAuthorId(String authorId, Pageable pageable);

    Page<Comment> findByParentId(String parentId, Pageable pageable);

    long countByRecipeId(String recipeId);
}
