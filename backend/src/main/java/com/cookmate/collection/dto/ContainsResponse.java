package com.cookmate.collection.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Tiny payload for {@code GET /collections/favorites/contains/{recipeId}}. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContainsResponse {
    private boolean saved;
}
