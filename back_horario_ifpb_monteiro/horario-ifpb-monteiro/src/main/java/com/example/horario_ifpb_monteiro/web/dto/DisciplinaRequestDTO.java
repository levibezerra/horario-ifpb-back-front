package com.example.horario_ifpb_monteiro.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DisciplinaRequestDTO(
        @NotBlank String nome,
        @NotNull Long cursoId
) {}