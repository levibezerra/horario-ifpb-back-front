package com.example.horario_ifpb_monteiro.web.dto;

import jakarta.validation.constraints.NotBlank;

public record DisciplinaDTO(
        Long id,

        @NotBlank(message = "O nome da disciplina é obrigatório")
        String nome
) {}