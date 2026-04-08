package com.cookmate.interaction.model;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("reactions")
@CompoundIndex(name = "user_recipe_idx", def = "{'recipeId': 1, 'authorId': 1}", unique = true)
public class Reaction {

    @Id private String id;

    private ReactionType type;

    @Indexed private String recipeId;

    @Indexed private String authorId;

    @CreatedDate private Instant createdAt;

    public enum ReactionType {
        LIKE,
        LOVE,
        HAHA,
        WOW,
        SAD,
        ANGRY
    }
}
