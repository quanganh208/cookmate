package com.cookmate.collection.model;

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
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("collections")
@CompoundIndexes({
    @CompoundIndex(name = "author_name_unique", def = "{'authorId': 1, 'name': 1}", unique = true)
})
public class Collection {

    @Id private String id;

    private String name;

    private String description;

    private String imageUrl;

    @Builder.Default private Boolean isPrivate = false;

    /**
     * Marks a server-managed collection (e.g. "Favorites"). System collections can't be deleted by
     * the user and don't accept {@code isSystem} from the request DTO — the server is the only
     * writer.
     */
    @Builder.Default private Boolean isSystem = false;

    @Indexed private String authorId;

    @Builder.Default private List<CollectionEntry> recipeIds = new ArrayList<>();

    @CreatedDate private Instant createdAt;

    @LastModifiedDate private Instant updatedAt;
}
