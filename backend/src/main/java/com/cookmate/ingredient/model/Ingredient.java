package com.cookmate.ingredient.model;

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
@Document("ingredients")
public class Ingredient {

    @Id private String id;

    @Indexed(unique = true)
    private String name;

    @Builder.Default private String unitDefault = "g";

    private String category;

    @CreatedDate private Instant createdAt;

    @LastModifiedDate private Instant updatedAt;
}
