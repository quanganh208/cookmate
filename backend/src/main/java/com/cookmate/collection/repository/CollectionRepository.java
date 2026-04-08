package com.cookmate.collection.repository;

import com.cookmate.collection.model.Collection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CollectionRepository extends MongoRepository<Collection, String> {

    Page<Collection> findByAuthorId(String authorId, Pageable pageable);

    Page<Collection> findByAuthorIdAndIsPrivate(
            String authorId, Boolean isPrivate, Pageable pageable);
}
