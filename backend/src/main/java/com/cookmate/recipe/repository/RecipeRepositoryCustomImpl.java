package com.cookmate.recipe.repository;

import com.cookmate.recipe.model.Recipe;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.TextCriteria;
import org.springframework.data.mongodb.core.query.TextQuery;

@RequiredArgsConstructor
public class RecipeRepositoryCustomImpl implements RecipeRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    @Override
    public Page<Recipe> searchByText(String query, Pageable pageable) {
        TextCriteria criteria = TextCriteria.forLanguage("none").matching(query);
        // `.with(pageable)` returns Query (not TextQuery), so assign the TextQuery first
        // and apply paging as a separate mutating call.
        TextQuery textQuery = TextQuery.queryText(criteria).sortByScore();
        textQuery.with(pageable);
        List<Recipe> hits = mongoTemplate.find(textQuery, Recipe.class);

        // Count with a fresh, un-paged text query on the same criteria.
        long total = mongoTemplate.count(TextQuery.queryText(criteria), "recipes");
        return new PageImpl<>(hits, pageable, total);
    }

    @Override
    public Page<Recipe> findAllByIdInForFavorites(
            List<String> ids, String viewerId, Pageable pageable) {
        if (ids == null || ids.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, 0);
        }
        // id ∈ {...} AND (status = PUBLISHED OR authorId = viewer)
        Criteria visibility =
                new Criteria()
                        .orOperator(
                                Criteria.where("status").is(Recipe.RecipeStatus.PUBLISHED),
                                Criteria.where("authorId").is(viewerId));
        Criteria base = Criteria.where("_id").in(ids).andOperator(visibility);

        Query page = Query.query(base).with(pageable);
        List<Recipe> hits = mongoTemplate.find(page, Recipe.class);
        long total = mongoTemplate.count(Query.query(base), Recipe.class);
        return new PageImpl<>(hits, pageable, total);
    }
}
