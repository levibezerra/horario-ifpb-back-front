package com.example.horario_ifpb_monteiro.web.dto;

public record AuthResponseDTO(
        String token,
        String tipo,
        String nome,
        String email
) {
    public AuthResponseDTO(String token, String nome, String email) {
        this(token, "Bearer", nome, email);
    }
}