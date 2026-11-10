package com.example.horario_ifpb_monteiro.web.exeption;

import java.time.LocalDateTime;
import java.util.List;

public record ErrorResponseDTO(
        int status,
        String message,
        List<String> errors,
        LocalDateTime timestamp
) {
    public ErrorResponseDTO(int status, String message) {
        this(status, message, null, LocalDateTime.now());
    }

    public ErrorResponseDTO(int status, String message, List<String> errors) {
        this(status, message, errors, LocalDateTime.now());
    }
}