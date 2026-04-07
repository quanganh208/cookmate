package com.cookmate.ingredient.controller;

import com.cookmate.ingredient.dto.IngredientRequest;
import com.cookmate.ingredient.dto.IngredientResponse;
import com.cookmate.ingredient.service.IngredientService;
import com.cookmate.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ingredients")
@RequiredArgsConstructor
@Tag(name = "Ingredients")
public class IngredientController {

    private final IngredientService ingredientService;

    @PostMapping
    @Operation(summary = "Create a new ingredient")
    public ResponseEntity<ApiResponse<IngredientResponse>> create(
            @Valid @RequestBody IngredientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(ingredientService.create(request)));
    }

    @GetMapping
    @Operation(summary = "Get all ingredients")
    public ResponseEntity<ApiResponse<List<IngredientResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok(ingredientService.findAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get ingredient by id")
    public ResponseEntity<ApiResponse<IngredientResponse>> findById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(ingredientService.findById(id)));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Get ingredients by category")
    public ResponseEntity<ApiResponse<List<IngredientResponse>>> findByCategory(
            @PathVariable String category) {
        return ResponseEntity.ok(ApiResponse.ok(ingredientService.findByCategory(category)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an ingredient")
    public ResponseEntity<ApiResponse<IngredientResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody IngredientRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(ingredientService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an ingredient")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        ingredientService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
