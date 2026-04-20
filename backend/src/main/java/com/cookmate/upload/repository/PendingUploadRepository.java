package com.cookmate.upload.repository;

import com.cookmate.upload.model.PendingUpload;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PendingUploadRepository extends MongoRepository<PendingUpload, String> {

    Optional<PendingUpload> findByUploadId(String uploadId);

    Optional<PendingUpload> findByUrl(String url);

    /** For the janitor: rows that no recipe ever claimed and are older than the cutoff. */
    List<PendingUpload> findByLinkedToRecipeIdIsNullAndUploadedAtBefore(Instant cutoff);
}
