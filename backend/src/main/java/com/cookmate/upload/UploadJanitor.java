package com.cookmate.upload;

import com.cookmate.upload.model.PendingUpload;
import com.cookmate.upload.repository.PendingUploadRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Daily cron (03:00) that deletes orphan R2 objects — uploads the client started but never linked
 * to a recipe (user abandoned the form). 24h grace period so a slow user session isn't wiped
 * mid-flight.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UploadJanitor {

    private static final Duration ORPHAN_AGE = Duration.ofHours(24);

    private final PendingUploadRepository repository;
    private final R2Service r2Service;

    @Scheduled(cron = "0 0 3 * * *")
    public void sweep() {
        Instant cutoff = Instant.now().minus(ORPHAN_AGE);
        List<PendingUpload> orphans =
                repository.findByLinkedToRecipeIdIsNullAndUploadedAtBefore(cutoff);
        if (orphans.isEmpty()) {
            return;
        }
        int deleted = 0;
        for (PendingUpload row : orphans) {
            try {
                r2Service.deleteObject(row.getObjectKey());
                repository.delete(row);
                deleted++;
            } catch (Exception ex) {
                log.warn(
                        "Janitor: failed to delete {} — will retry next run ({})",
                        row.getObjectKey(),
                        ex.getMessage());
            }
        }
        log.info("Janitor swept {} orphan uploads", deleted);
    }
}
