package com.cookmate.recipe.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Step {

    private Integer number;

    private String description;

    private String imageUrl;

    private String videoUrl;
}
