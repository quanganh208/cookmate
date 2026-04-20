package com.cookmate.recipe.repository;

import com.cookmate.recipe.model.Recipe;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Hand-rolled queries that Spring Data derived methods can't express. In particular, full-text
 * search sorted by {@code $meta:"textScore"} needs a real {@link
 * org.springframework.data.mongodb.core.query.TextQuery} built against {@code MongoTemplate}.
 */
public interface RecipeRepositoryCustom {

    /**
     * Full-text search over {@code title} + {@code description}. Uses {@code language:"none"}
     * tokenisation (whitespace split, no stemming) to support Vietnamese and mixed-locale titles.
     * Results are sorted by text score, tie-broken by {@link Pageable} sort if supplied.
     */
    Page<Recipe> searchByText(String query, Pageable pageable);

    /**
     * Batch fetch recipes by id for the Favorites screen. Returns only PUBLISHED recipes plus the
     * viewer's own drafts (for the "save your own draft to check it later" case), so another user's
     * private draft never leaks through the favorites list — matches the enumeration-oracle rule on
     * {@code addRecipe}.
     *
     * <p>Crucially does NOT touch view count: Favorites browsing is not a page view.
     */
    Page<Recipe> findAllByIdInForFavorites(List<String> ids, String viewerId, Pageable pageable);
}
