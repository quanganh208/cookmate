package com.cookmate.ingredient.seed;

import com.cookmate.ingredient.model.Ingredient;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

/**
 * Seeds the ingredient catalog on app boot. Reads {@code seed/ingredients.json} and performs a
 * per-item upsert via {@link MongoTemplate#upsert} keyed by {@code name} — idempotent on rolling
 * restart, race-safe across concurrent-boot instances, and incremental if the list grows later
 * (only missing rows get inserted).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class IngredientSeeder implements CommandLineRunner {

    private static final String SEED_PATH = "seed/ingredients.json";

    private final MongoTemplate mongoTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void run(String... args) {
        List<Map<String, Object>> entries;
        try (InputStream is = new ClassPathResource(SEED_PATH).getInputStream()) {
            entries =
                    objectMapper.readValue(
                            is, new com.fasterxml.jackson.core.type.TypeReference<>() {});
        } catch (IOException e) {
            log.warn("Ingredient seed file not found or unreadable — skipping: {}", e.getMessage());
            return;
        }

        int inserted = 0;
        for (Map<String, Object> entry : entries) {
            Object name = entry.get("name");
            if (!(name instanceof String ingredientName) || ingredientName.isBlank()) continue;

            Update update =
                    new Update()
                            .setOnInsert("name", ingredientName)
                            .setOnInsert("category", entry.getOrDefault("category", null))
                            .setOnInsert("unitDefault", entry.getOrDefault("unitDefault", "g"));
            var result =
                    mongoTemplate.upsert(
                            Query.query(Criteria.where("name").is(ingredientName)),
                            update,
                            Ingredient.class);
            if (result.getUpsertedId() != null) {
                inserted++;
            }
        }
        if (inserted > 0) {
            log.info("IngredientSeeder: inserted {} new ingredient(s)", inserted);
        }
    }
}
