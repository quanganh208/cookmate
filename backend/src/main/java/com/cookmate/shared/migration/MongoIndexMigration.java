package com.cookmate.shared.migration;

import jakarta.annotation.PostConstruct;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexInfo;
import org.springframework.data.mongodb.core.index.TextIndexDefinition;
import org.springframework.data.mongodb.core.index.TextIndexDefinition.TextIndexDefinitionBuilder;
import org.springframework.stereotype.Component;

/**
 * Startup index reconciliation. Spring Data MongoDB auto-creates a text index for
 * {@code @TextIndexed} fields using the default English analyzer. For Vietnamese + mixed-locale
 * recipe titles we want {@code language:"none"} (whitespace tokenisation, no stemming). This
 * component drops the stale index on boot if its language differs and lets us (re)create it
 * explicitly with the right config.
 *
 * <p>Idempotent: safe on rolling restarts and in tests. Errors are logged but do not block startup.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MongoIndexMigration {

    private static final String RECIPES_COLLECTION = "recipes";
    private static final String TEXT_INDEX_LANGUAGE = "none";

    private final MongoTemplate mongoTemplate;

    @PostConstruct
    public void reconcileRecipeTextIndex() {
        try {
            List<IndexInfo> indexes = mongoTemplate.indexOps(RECIPES_COLLECTION).getIndexInfo();
            IndexInfo existingText =
                    indexes.stream()
                            .filter(i -> i.getName().contains("_text"))
                            .findFirst()
                            .orElse(null);

            if (existingText != null && !hasExpectedLanguage(existingText)) {
                log.info(
                        "Dropping stale text index '{}' on recipes — language mismatch, expected '{}'",
                        existingText.getName(),
                        TEXT_INDEX_LANGUAGE);
                mongoTemplate.indexOps(RECIPES_COLLECTION).dropIndex(existingText.getName());
                existingText = null;
            }

            if (existingText == null) {
                TextIndexDefinition def =
                        new TextIndexDefinitionBuilder()
                                .onField("title", 2F)
                                .onField("description")
                                .withDefaultLanguage(TEXT_INDEX_LANGUAGE)
                                .build();
                mongoTemplate.indexOps(RECIPES_COLLECTION).ensureIndex(def);
                log.info(
                        "Created text index on recipes(title,description) language='{}'",
                        TEXT_INDEX_LANGUAGE);
            }
        } catch (Exception e) {
            log.warn("Recipe text index reconciliation failed: {}", e.getMessage());
        }
    }

    /**
     * {@link IndexInfo} doesn't expose the default_language directly, so we read the raw index
     * document via the command channel. Returns {@code true} iff the index already matches the
     * expected language (prevents needless drops on every boot).
     */
    private boolean hasExpectedLanguage(IndexInfo index) {
        Document stats =
                mongoTemplate.execute(
                        RECIPES_COLLECTION,
                        collection -> {
                            for (Document raw : collection.listIndexes()) {
                                if (index.getName().equals(raw.getString("name"))) {
                                    return raw;
                                }
                            }
                            return null;
                        });
        if (stats == null) return false;
        String lang = stats.getString("default_language");
        return TEXT_INDEX_LANGUAGE.equals(lang);
    }
}
