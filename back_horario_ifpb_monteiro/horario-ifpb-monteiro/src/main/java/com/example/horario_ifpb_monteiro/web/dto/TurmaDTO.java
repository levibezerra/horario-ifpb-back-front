package com.example.horario_ifpb_monteiro.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TurmaDTO(
        Long id,

        @NotBlank(message = "O nome da turma é obrigatório")
        String nome,

        @NotNull(message = "O ID do curso é obrigatório")
        Long cursoId,

        String cursoNome
) {}