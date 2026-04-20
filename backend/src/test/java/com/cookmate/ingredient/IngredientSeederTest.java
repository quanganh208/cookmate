package com.cookmate.ingredient;

import static org.junit.jupiter.api.Assertions.*;

import com.cookmate.ingredient.model.Ingredient;
import com.cookmate.ingredient.repository.IngredientRepository;
import com.cookmate.ingredient.seed.IngredientSeeder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/**
 * Seeder is idempotent — running it twice doesn't duplicate rows, and running it against a
 * partially populated collection only inserts the missing ones.
 */
@SpringBootTest
@TestPropertySource(
        properties = {"spring.data.mongodb.uri=mongodb://localhost:27017/cookmate-test"})
class IngredientSeederTest {

    @Autowired private IngredientRepository ingredientRepository;
    @Autowired private IngredientSeeder seeder;

    @BeforeEach
    void reset() {
        ingredientRepository.deleteAll();
    }

    @Test
    void run_OnEmptyCollection_InsertsAllEntries() {
        assertEquals(0, ingredientRepository.count());
        seeder.run();
        long count = ingredientRepository.count();
        assertTrue(count >= 100, "expected >= 100 seeded ingredients, got " + count);
    }

    @Test
    void run_Twice_IsIdempotent() {
        seeder.run();
        long after1 = ingredientRepository.count();
        seeder.run();
        long after2 = ingredientRepository.count();
        assertEquals(after1, after2, "second seed must not duplicate rows");
    }

    @Test
    void run_WithPartialCollection_OnlyInsertsMissing() {
        // Pre-populate with one known seed entry.
        ingredientRepository.save(
                Ingredient.builder().name("Muối").category("Spice").unitDefault("g").build());
        long before = ingredientRepository.count();
        assertEquals(1, before);

        seeder.run();
        long after = ingredientRepository.count();
        assertTrue(after > before, "seeder should have added new entries");
        // Still exactly one Muối (not duplicated).
        assertEquals(
                1,
                ingredientRepository.findAll().stream()
                        .filter(i -> "Muối".equals(i.getName()))
                        .count());
    }
}
