package com.cookmate.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Unified API response envelope for all endpoints. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private ErrorDetail error;
    private String timestamp;

    /** Error details included when success is false. */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErrorDetail {
        private String code;
        private String message;
    }

    /** Success response with data payload. */
    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .timestamp(Instant.now().toString())
                .build();
    }

    /** Success response with no data (e.g., logout). */
    public static ApiResponse<Void> ok() {
        return ApiResponse.<Void>builder()
                .success(true)
                .timestamp(Instant.now().toString())
                .build();
    }

    /** Error response with code and message. */
    public static ApiResponse<Void> error(String code, String message) {
        return ApiResponse.<Void>builder()
                .success(false)
                .error(ErrorDetail.builder().code(code).message(message).build())
                .timestamp(Instant.now().toString())
                .build();
    }
}
