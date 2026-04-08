package com.cookmate.interaction.dto;

import com.cookmate.interaction.model.Reaction.ReactionType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionRequest {

    @NotNull(message = "Reaction type is required")
    private ReactionType type;
}
