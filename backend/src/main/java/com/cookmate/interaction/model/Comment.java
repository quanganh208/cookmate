package com.cookmate.interaction.model;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("comments")
public class Comment {

    @Id private String id;

    private String content;

    @Indexed private String recipeId;

    @Indexed private String authorId;

    private String parentId;

    @CreatedDate private Instant createdAt;

    @LastModifiedDate private Instant updatedAt;
}
