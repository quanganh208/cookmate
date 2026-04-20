package com.cookmate.recipe.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.cookmate.recipe.dto.RecipeResponse;
import com.cookmate.recipe.service.RecipeSearchRateLimiter;
import com.cookmate.recipe.service.RecipeService;
import com.cookmate.shared.dto.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

/**
 * Pure unit test for the {@code view} query gate on {@code GET /recipes/{id}}. Exercises the
 * controller in isolation with a mocked service so we can assert exactly when {@link
 * RecipeService#incrementViewCount(String)} runs.
 */
class RecipeControllerViewGateTest {

    private RecipeService recipeService;
    private RecipeSearchRateLimiter searchRateLimiter;
    private RecipeController controller;

    @BeforeEach
    void setUp() {
        recipeService = mock(RecipeService.class);
        searchRateLimiter = mock(RecipeSearchRateLimiter.class);
        controller = new RecipeController(recipeService, searchRateLimiter);
        RecipeResponse stub = RecipeResponse.builder().id("r1").title("Test").build();
        when(recipeService.findByIdWithAuthor(anyString())).thenReturn(stub);
    }

    @Test
    void findById_defaultViewTrue_incrementsViewCount() {
        ResponseEntity<ApiResponse<RecipeResponse>> response = controller.findById("r1", true);

        verify(recipeService, times(1)).incrementViewCount("r1");
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    void findById_viewFalse_skipsIncrement() {
        ResponseEntity<ApiResponse<RecipeResponse>> response = controller.findById("r1", false);

        verify(recipeService, never()).incrementViewCount(anyString());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
    }
}
