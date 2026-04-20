package com.cookmate.collection;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.cookmate.auth.dto.AuthResponse;
import com.cookmate.auth.dto.RegisterRequest;
import com.cookmate.auth.repository.RefreshTokenRepository;
import com.cookmate.auth.repository.UserRepository;
import com.cookmate.collection.dto.RecipeIdRequest;
import com.cookmate.collection.model.Collection;
import com.cookmate.collection.repository.CollectionRepository;
import com.cookmate.collection.service.CollectionService;
import com.cookmate.collection.service.FavoritesRateLimiter;
import com.cookmate.recipe.model.Recipe;
import com.cookmate.recipe.repository.RecipeRepository;
import com.cookmate.shared.service.EmailService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/**
 * Integration tests for the Favorites slice (Phase 4.4). Exercises the full slice against the real
 * test Mongo container from CI: auto-create on first read, idempotency, delete guard, reserved-name
 * rejection (Unicode variants), DTO isSystem spoof, enumeration-oracle for hidden recipes,
 * cross-user isolation, pagination, visibility filter, concurrent-create race safety, and rate
 * limit.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@TestPropertySource(
        properties = {
            "spring.data.mongodb.uri=mongodb://localhost:27017/cookmate-test",
            // Tight rate limit so a single extra save exercises the 429 path deterministically.
            "app.favorites.rate-limit.max-requests=5",
            "app.favorites.rate-limit.window-seconds=60"
        })
class FavoritesIntegrationTest {

    private static final String API_KEY = "dev-api-key-change-in-production";

    @Autowired private WebApplicationContext webApplicationContext;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private CollectionRepository collectionRepository;
    @Autowired private RecipeRepository recipeRepository;
    @Autowired private CollectionService collectionService;
    @Autowired private FavoritesRateLimiter rateLimiter;

    @MockitoBean private EmailService emailService;

    private MockMvc mockMvc;
    private String userAToken;
    private String userBToken;
    private String userAId;
    private Recipe published;
    private Recipe userAOwnDraft;
    private Recipe userBDraft;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc =
                MockMvcBuilders.webAppContextSetup(webApplicationContext)
                        .apply(springSecurity())
                        .build();
        rateLimiter.reset();
        collectionRepository.deleteAll();
        recipeRepository.deleteAll();
        userRepository.deleteAll();
        refreshTokenRepository.deleteAll();

        AuthResponse userA = registerUser("a@example.com", "SecurePass123!", "User A");
        AuthResponse userB = registerUser("b@example.com", "SecurePass123!", "User B");
        userAToken = userA.getAccessToken();
        userBToken = userB.getAccessToken();
        userAId = userA.getUser().getId();

        published =
                recipeRepository.save(
                        recipe("Published recipe", Recipe.RecipeStatus.PUBLISHED, userAId));
        userAOwnDraft =
                recipeRepository.save(recipe("User A draft", Recipe.RecipeStatus.DRAFT, userAId));
        userBDraft =
                recipeRepository.save(
                        recipe(
                                "User B private draft",
                                Recipe.RecipeStatus.DRAFT,
                                userB.getUser().getId()));
    }

    // -- Helpers --

    private AuthResponse registerUser(String email, String password, String name) throws Exception {
        RegisterRequest r = new RegisterRequest();
        r.setEmail(email);
        r.setPassword(password);
        r.setDisplayName(name);
        MvcResult result =
                mockMvc.perform(
                                post("/api/auth/register")
                                        .header("X-API-Key", API_KEY)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(r)))
                        .andExpect(status().isCreated())
                        .andReturn();
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return objectMapper.treeToValue(root.get("data"), AuthResponse.class);
    }

    private Recipe recipe(String title, Recipe.RecipeStatus status, String authorId) {
        return Recipe.builder()
                .title(title)
                .description(title + " description")
                .imageUrl("https://example.com/img.jpg")
                .cookTime(30)
                .difficulty("Medium")
                .category("Dinner")
                .status(status)
                .authorId(authorId)
                .build();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private String asJson(Object o) throws Exception {
        return objectMapper.writeValueAsString(o);
    }

    // -- Tests --

    @Test
    void getFavorites_FirstCall_CreatesSystemCollection() throws Exception {
        assertEquals(0, collectionRepository.count());

        mockMvc.perform(
                        get("/api/collections/favorites")
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer(userAToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Favorites"))
                .andExpect(jsonPath("$.data.isSystem").value(true))
                .andExpect(jsonPath("$.data.authorId").value(userAId));

        assertEquals(1, collectionRepository.count());
    }

    @Test
    void getFavorites_SecondCall_DoesNotDuplicate() throws Exception {
        mockMvc.perform(
                        get("/api/collections/favorites")
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer(userAToken)))
                .andExpect(status().isOk());
        mockMvc.perform(
                        get("/api/collections/favorites")
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer(userAToken)))
                .andExpect(status().isOk());
        assertEquals(1, collectionRepository.count());
    }

    @Test
    void getFavorites_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/collections/favorites").header("X-API-Key", API_KEY))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getFavorites_ConcurrentFirstAccess_CreatesExactlyOne() throws Exception {
        CompletableFuture<Void> a =
                CompletableFuture.runAsync(() -> collectionService.getOrCreateFavorites(userAId));
        CompletableFuture<Void> b =
                CompletableFuture.runAsync(() -> collectionService.getOrCreateFavorites(userAId));
        CompletableFuture.allOf(a, b).join();
        assertEquals(1, collectionRepository.count());
    }

    @Test
    void getFavorites_LegacyNonSystem_SelfHealsOnRead() throws Exception {
        Collection legacy =
                Collection.builder().name("Favorites").authorId(userAId).isSystem(false).build();
        collectionRepository.save(legacy);

        mockMvc.perform(
                        get("/api/collections/favorites")
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer(userAToken)))
                .andExpect(jsonPath("$.data.isSystem").value(true));
    }

    @Test
    void addFavorite_ThenContains_TrueThenIdempotent() throws Exception {
        RecipeIdRequest req = new RecipeIdRequest();
        req.setRecipeId(published.getId());
        mockMvc.perform(
                        post("/api/collections/favorites/recipes")
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer(userAToken))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJson(req)))
                .andExpect(status().isOk());
        // Duplicate add is idempotent.
        mockMvc.perform(
                        post("/api/collections/favorites/recipes")
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer(userAToken))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJson(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recipeCount").value(1));
        mockMvc.perform(
                        get("/api/collections/favorites/contains/" + published.getId())
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer(userAToken)))
                .andExpect(jsonPath("$.data.saved").value(true));
    }

    @Test
    void removeFavorite_IsIdempotent() throws Exception {
        mockMvc.perform(
                        delete("/api/collections/favorites/recipes/" + published.getId())
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer(userAToken)))
                .andExpect(status().isOk());
    }

    @Test
    void getFavoritesRecipes_Paginated_OnlyPublishedOrOwnDrafts() throws Exception {
        collectionService.addToFavorites(published.getId(), userAId);
        collectionService.addToFavorites(userAOwnDraft.getId(), userAId);

        mockMvc.perform(
                        get("/api/collections/favorites/recipes")
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer(userAToken))
                                .param("page", "0")
                                .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.size").value(20));
    }

    @Test
    void addFavorite_UnknownRecipe_Returns404() throws Exception {
        RecipeIdRequest req = new RecipeIdRequest();
        req.setRecipeId("does-not-exist");
        mockMvc.perform(
                        post("/api/collections/favorites/recipes")
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer(userAToken))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJson(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void addFavorite_OtherUsersDraft_Returns404_NoEnumerationOracle() throws Exception {
        RecipeIdRequest req = new RecipeIdRequest();
        req.setRecipeId(userBDraft.getId());
        mockMvc.perform(
                        post("/api/collections/favorites/recipes")
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer(userAToken))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJson(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void addFavorite_OwnDraft_Succeeds() throws Exception {
        RecipeIdRequest req = new RecipeIdRequest();
        req.setRecipeId(userAOwnDraft.getId());
        mockMvc.perform(
                        post("/api/collections/favorites/recipes")
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer(userAToken))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJson(req)))
                .andExpect(status().isOk());
    }

    @Test
    void deleteSystemFavorites_Returns400() throws Exception {
        Collection fav = collectionService.getOrCreateFavorites(userAId);
        mockMvc.perform(
                        delete("/api/collections/" + fav.getId())
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer(userAToken)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createCollection_ReservedName_Rejected() throws Exception {
        // Variants: canonical, uppercase, UK spelling with padding, zero-width char, Vietnamese.
        List<String> variants =
                List.of("Favorites", "FAVORITES", "  Favourites  ", "Fav\u200Borites", "yêu thích");
        for (String bad : variants) {
            com.cookmate.collection.dto.CollectionRequest req =
                    new com.cookmate.collection.dto.CollectionRequest();
            req.setName(bad);
            mockMvc.perform(
                            post("/api/collections")
                                    .header("X-API-Key", API_KEY)
                                    .header("Authorization", bearer(userAToken))
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(asJson(req)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void createCollection_SpoofedIsSystem_Ignored() throws Exception {
        String body = "{\"name\":\"My List\",\"isSystem\":true}";
        MvcResult result =
                mockMvc.perform(
                                post("/api/collections")
                                        .header("X-API-Key", API_KEY)
                                        .header("Authorization", bearer(userAToken))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(body))
                        .andExpect(status().isCreated())
                        .andReturn();
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        assertFalse(root.path("data").path("isSystem").asBoolean());
    }

    @Test
    void userB_CannotSeeUserA_Favorites() throws Exception {
        collectionService.addToFavorites(published.getId(), userAId);
        mockMvc.perform(
                        get("/api/collections/favorites/recipes")
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer(userBToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void addFavorite_ExceedsRateLimit_Returns429() throws Exception {
        RecipeIdRequest req = new RecipeIdRequest();
        req.setRecipeId(published.getId());
        // 5 allowed per configured test window; 6th should be rejected.
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(
                            post("/api/collections/favorites/recipes")
                                    .header("X-API-Key", API_KEY)
                                    .header("Authorization", bearer(userAToken))
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(asJson(req)))
                    .andExpect(status().isOk());
        }
        mockMvc.perform(
                        post("/api/collections/favorites/recipes")
                                .header("X-API-Key", API_KEY)
                                .header("Authorization", bearer(userAToken))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJson(req)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("RATE_LIMITED"));
    }
}
