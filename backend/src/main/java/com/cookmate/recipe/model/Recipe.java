package com.cookmate.recipe.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("recipes")
public class Recipe {

    @Id private String id;

    // Text index language is set to "none" (whitespace split, no stemming) by
    // MongoIndexMigration at startup — supports Vietnamese + mixed-locale titles
    // better than the default "english" analyzer.
    @TextIndexed(weight = 2F)
    private String title;

    @TextIndexed private String description;

    private String imageUrl;

    private Integer serving;

    private Integer prepTime;

    private Integer cookTime;

    private String difficulty;

    private String cuisine;

    @Builder.Default private RecipeStatus status = RecipeStatus.DRAFT;

    @Builder.Default private Long viewCount = 0L;

    @Builder.Default private Long likeCount = 0L;

    @Builder.Default private Boolean isFeatured = false;

    @Indexed private String authorId;

    private String category;

    @Builder.Default private List<Step> steps = new ArrayList<>();

    @Builder.Default private List<RecipeIngredient> ingredients = new ArrayList<>();

    @CreatedDate private Instant createdAt;

    @LastModifiedDate private Instant updatedAt;

    public enum RecipeStatus {
        DRAFT,
        PUBLISHED,
        ARCHIVED
    }
}
