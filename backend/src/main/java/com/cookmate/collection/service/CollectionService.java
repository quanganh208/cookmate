package com.cookmate.collection.service;

import com.cookmate.collection.dto.CollectionRequest;
import com.cookmate.collection.dto.CollectionResponse;
import com.cookmate.collection.model.Collection;
import com.cookmate.collection.model.CollectionEntry;
import com.cookmate.collection.repository.CollectionRepository;
import com.cookmate.recipe.dto.RecipeResponse;
import com.cookmate.recipe.model.Recipe;
import com.cookmate.recipe.repository.RecipeRepository;
import com.cookmate.shared.exception.ResourceNotFoundException;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class CollectionService {

    /** Name under which the per-user system Favorites collection is stored. */
    public static final String FAVORITES_NAME = "Favorites";

    /**
     * Names the user is never allowed to use for a collection. Compared AFTER {@linkplain
     * Normalizer.Form#NFKC NFKC} normalisation, control/zero-width strip, trim, and {@link
     * Locale#ROOT} lowercase — so all of {@code "Favorites"}, {@code "FAVORITES"}, {@code "
     * Fav\u200Borites "}, {@code "Favourites"}, {@code "yêu thích"} collapse to the same key and
     * get rejected.
     */
    private static final Set<String> RESERVED_NAMES =
            Set.of(
                    "favorites",
                    "favourites",
                    "favorite",
                    "favourite",
                    "saved",
                    "yêu thích",
                    "đã lưu");

    private final CollectionRepository collectionRepository;
    private final RecipeRepository recipeRepository;
    private final MongoTemplate mongoTemplate;

    // -- Generic CRUD --

    public CollectionResponse create(CollectionRequest request, String authorId) {
        rejectReservedName(request.getName());
        Collection collection =
                Collection.builder()
                        .name(request.getName())
                        .description(request.getDescription())
                        .imageUrl(request.getImageUrl())
                        .isPrivate(request.getIsPrivate() != null ? request.getIsPrivate() : false)
                        .isSystem(false)
                        .authorId(authorId)
                        .recipeIds(new ArrayList<>())
                        .build();
        return CollectionResponse.from(collectionRepository.save(collection));
    }

    public CollectionResponse findById(String id) {
        return collectionRepository
                .findById(id)
                .map(CollectionResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Collection", id));
    }

    public Page<CollectionResponse> findByAuthorId(String authorId, Pageable pageable) {
        return collectionRepository
                .findByAuthorId(authorId, pageable)
                .map(CollectionResponse::from);
    }

    public CollectionResponse update(String id, CollectionRequest request, String authorId) {
        Collection collection = loadOwned(id, authorId);
        if (request.getName() != null) {
            rejectReservedName(request.getName());
            collection.setName(request.getName());
        }
        if (request.getDescription() != null) collection.setDescription(request.getDescription());
        if (request.getImageUrl() != null) collection.setImageUrl(request.getImageUrl());
        if (request.getIsPrivate() != null) collection.setIsPrivate(request.getIsPrivate());
        return CollectionResponse.from(collectionRepository.save(collection));
    }

    public CollectionResponse addRecipe(String id, String recipeId, String authorId) {
        Collection collection = loadOwned(id, authorId);
        assertRecipeVisible(recipeId, authorId);
        appendIfAbsent(collection, recipeId);
        return CollectionResponse.from(collectionRepository.save(collection));
    }

    public CollectionResponse removeRecipe(String id, String recipeId, String authorId) {
        Collection collection = loadOwned(id, authorId);
        if (collection.getRecipeIds() != null) {
            collection.getRecipeIds().removeIf(e -> e.getRecipeId().equals(recipeId));
        }
        return CollectionResponse.from(collectionRepository.save(collection));
    }

    public void delete(String id, String authorId) {
        Collection collection = loadOwned(id, authorId);
        if (Boolean.TRUE.equals(collection.getIsSystem())) {
            throw new IllegalArgumentException("Cannot delete system collection");
        }
        collectionRepository.deleteById(id);
    }

    // -- Favorites (system) --

    /**
     * Atomically find-or-create the per-user Favorites collection. Uses {@code findAndModify} with
     * {@code $setOnInsert} so concurrent callers can never race two inserts — the compound unique
     * index on {@code (authorId, name)} is the final safety net.
     *
     * <p>Legacy self-heal: if an older non-system Favorites row exists for this user, flip its
     * {@code isSystem} flag to true on the same call so the delete guard kicks in from now on.
     */
    public Collection getOrCreateFavorites(String authorId) {
        Query query =
                Query.query(Criteria.where("authorId").is(authorId).and("name").is(FAVORITES_NAME));
        Update update =
                new Update()
                        .setOnInsert("name", FAVORITES_NAME)
                        .setOnInsert("authorId", authorId)
                        .setOnInsert("isPrivate", true)
                        .setOnInsert("recipeIds", new ArrayList<>())
                        .setOnInsert("createdAt", Instant.now())
                        .set("isSystem", true);
        FindAndModifyOptions opts = FindAndModifyOptions.options().returnNew(true).upsert(true);
        return mongoTemplate.findAndModify(query, update, opts, Collection.class);
    }

    public CollectionResponse favoritesFor(String authorId) {
        return CollectionResponse.from(getOrCreateFavorites(authorId));
    }

    public CollectionResponse addToFavorites(String recipeId, String authorId) {
        assertRecipeVisible(recipeId, authorId);
        Collection fav = getOrCreateFavorites(authorId);
        appendIfAbsent(fav, recipeId);
        return CollectionResponse.from(collectionRepository.save(fav));
    }

    public void removeFromFavorites(String recipeId, String authorId) {
        Collection fav = getOrCreateFavorites(authorId);
        if (fav.getRecipeIds() != null) {
            fav.getRecipeIds().removeIf(e -> e.getRecipeId().equals(recipeId));
            collectionRepository.save(fav);
        }
    }

    public boolean favoritesContains(String recipeId, String authorId) {
        Collection fav = getOrCreateFavorites(authorId);
        return fav.getRecipeIds() != null
                && fav.getRecipeIds().stream().anyMatch(e -> e.getRecipeId().equals(recipeId));
    }

    /**
     * Paginated recipe view of the user's Favorites. Fetches only PUBLISHED recipes plus the user's
     * own drafts, and crucially does NOT route through {@link
     * com.cookmate.recipe.service.RecipeService#findByIdWithAuthor} — so saving a recipe and then
     * browsing the Favorites screen never inflates its {@code viewCount}.
     *
     * <p>Implementation: two queries (collection → page of recipes) per the locked architectural
     * decision V1 — $lookup aggregation was rejected as YAGNI at hobby scale.
     */
    public Page<RecipeResponse> getFavoritesRecipes(String authorId, Pageable pageable) {
        Collection fav = getOrCreateFavorites(authorId);
        List<String> ids =
                fav.getRecipeIds() == null
                        ? List.of()
                        : fav.getRecipeIds().stream().map(CollectionEntry::getRecipeId).toList();
        if (ids.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, 0);
        }
        Page<Recipe> page = recipeRepository.findAllByIdInForFavorites(ids, authorId, pageable);
        return page.map(RecipeResponse::from);
    }

    // -- Internal helpers --

    private Collection loadOwned(String id, String authorId) {
        Collection collection =
                collectionRepository
                        .findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Collection", id));
        if (!collection.getAuthorId().equals(authorId)) {
            throw new ResourceNotFoundException("Collection", id);
        }
        return collection;
    }

    private void appendIfAbsent(Collection collection, String recipeId) {
        if (collection.getRecipeIds() == null) collection.setRecipeIds(new ArrayList<>());
        boolean exists =
                collection.getRecipeIds().stream().anyMatch(e -> e.getRecipeId().equals(recipeId));
        if (!exists) {
            collection
                    .getRecipeIds()
                    .add(
                            CollectionEntry.builder()
                                    .recipeId(recipeId)
                                    .addedAt(Instant.now())
                                    .build());
        }
    }

    /**
     * Enforces "recipe must exist and be visible". Uses a uniform 404 for every failure mode
     * (missing, archived, someone else's draft) so an attacker can't use favorites as an oracle to
     * probe private drafts.
     */
    private void assertRecipeVisible(String recipeId, String viewerId) {
        Recipe recipe =
                recipeRepository
                        .findById(recipeId)
                        .orElseThrow(() -> new ResourceNotFoundException("Recipe", recipeId));
        boolean published = recipe.getStatus() == Recipe.RecipeStatus.PUBLISHED;
        boolean ownDraft =
                recipe.getStatus() == Recipe.RecipeStatus.DRAFT
                        && viewerId.equals(recipe.getAuthorId());
        if (!published && !ownDraft) {
            throw new ResourceNotFoundException("Recipe", recipeId);
        }
    }

    private void rejectReservedName(String raw) {
        if (raw == null) return;
        String normalized =
                Normalizer.normalize(raw, Normalizer.Form.NFKC)
                        .replaceAll("\\p{C}", "")
                        .trim()
                        .toLowerCase(Locale.ROOT);
        if (RESERVED_NAMES.contains(normalized)) {
            throw new IllegalArgumentException("\"" + raw + "\" is a reserved collection name");
        }
    }
}
