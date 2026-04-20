package com.cookmate.recipe;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.cookmate.recipe.model.Recipe;
import com.cookmate.recipe.repository.RecipeRepository;
import com.cookmate.recipe.service.RecipeSearchRateLimiter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/**
 * Integration test for {@code GET /api/recipes/search}. Seeds three recipes (Vietnamese + English
 * titles) against the real test Mongo container from CI, then exercises the full slice: auth-free
 * public access, text matching via the {@code language:"none"} index, empty-query rejection,
 * pagination, and the {@code size} cap.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@TestPropertySource(
        properties = {
            "spring.data.mongodb.uri=mongodb://localhost:27017/cookmate-test",
            // Tight rate limit so a single extra request exercises the 429 path deterministically.
            "app.recipe-search.rate-limit.max-requests=3",
            "app.recipe-search.rate-limit.window-seconds=60"
        })
class RecipeSearchIntegrationTest {

    private static final String API_KEY = "dev-api-key-change-in-production";

    @Autowired private WebApplicationContext webApplicationContext;
    @Autowired private RecipeRepository recipeRepository;
    @Autowired private RecipeSearchRateLimiter rateLimiter;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc =
                MockMvcBuilders.webAppContextSetup(webApplicationContext)
                        .apply(springSecurity())
                        .build();
        rateLimiter.reset();
        recipeRepository.deleteAll();
        recipeRepository.save(buildRecipe("Phở Bò Hà Nội", "Beef noodle soup from Hanoi"));
        recipeRepository.save(buildRecipe("Bún Chả", "Grilled pork with rice noodles"));
        recipeRepository.save(buildRecipe("Margherita Pizza", "Classic Italian tomato pizza"));
    }

    @Test
    void search_MatchesVietnameseTitle() throws Exception {
        mockMvc.perform(get("/api/recipes/search").header("X-API-Key", API_KEY).param("q", "Phở"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].title").value("Phở Bò Hà Nội"));
    }

    @Test
    void search_MatchesEnglishDescription() throws Exception {
        mockMvc.perform(get("/api/recipes/search").header("X-API-Key", API_KEY).param("q", "pizza"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].title").value("Margherita Pizza"));
    }

    @Test
    void search_EmptyQuery_Returns400() throws Exception {
        mockMvc.perform(get("/api/recipes/search").header("X-API-Key", API_KEY).param("q", ""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void search_Pagination_HonorsPageParam() throws Exception {
        mockMvc.perform(
                        get("/api/recipes/search")
                                .header("X-API-Key", API_KEY)
                                .param("q", "noodle")
                                .param("page", "0")
                                .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.size").value(1))
                .andExpect(jsonPath("$.data.number").value(0));
    }

    @Test
    void search_PageableSize_CappedAt50() throws Exception {
        mockMvc.perform(
                        get("/api/recipes/search")
                                .header("X-API-Key", API_KEY)
                                .param("q", "noodle")
                                .param("size", "10000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.size").value(50));
    }

    @Test
    void search_ExceedsRateLimit_Returns429() throws Exception {
        // 3 allowed; 4th should be rejected.
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(
                            get("/api/recipes/search")
                                    .header("X-API-Key", API_KEY)
                                    .param("q", "noodle"))
                    .andExpect(status().isOk());
        }
        mockMvc.perform(
                        get("/api/recipes/search")
                                .header("X-API-Key", API_KEY)
                                .param("q", "noodle"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("RATE_LIMITED"));
    }

    private Recipe buildRecipe(String title, String description) {
        return Recipe.builder()
                .title(title)
                .description(description)
                .imageUrl("https://example.com/img.jpg")
                .cookTime(30)
                .difficulty("Medium")
                .category("Dinner")
                .status(Recipe.RecipeStatus.PUBLISHED)
                .authorId("test-author")
                .build();
    }
}
