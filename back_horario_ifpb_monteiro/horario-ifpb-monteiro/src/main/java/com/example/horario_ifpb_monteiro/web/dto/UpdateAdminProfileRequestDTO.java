package com.example.horario_ifpb_monteiro.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateAdminProfileRequestDTO(
        Long id,

        @NotBlank(message = "O nome é obrigatório")
        String nome,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "Formato de e-mail inválido")
        String email,

        @Size(min = 6, message = "A senha deve ter no mínimo 6 caracteres")
        String novaSenha
) {
        // Construtor utilitário para respostas onde a senha não é exposta
        public UpdateAdminProfileRequestDTO(Long id, String nome, String email) {
                this(id, nome, email, null);
        }
}