package com.example.horario_ifpb_monteiro.web.exeption;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponseDTO(
        int status,
        String code,
        String message,
        Map<String, String> errors,
        LocalDateTime timestamp,
        String path
) {
    public ErrorResponseDTO(int status, String message) {
        this(status, null, message, null, LocalDateTime.now(), null);
    }

    public ErrorResponseDTO(int status, String code, String message, String path) {
        this(status, code, message, null, LocalDateTime.now(), path);
    }

    public ErrorResponseDTO(int status, String code, String message, Map<String, String> errors, String path) {
        this(status, code, message, errors, LocalDateTime.now(), path);
    }
}