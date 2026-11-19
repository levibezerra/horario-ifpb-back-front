package com.example.horario_ifpb_monteiro.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record DisciplinaDTO(
        Long id,

        @NotBlank(message = "O nome da disciplina é obrigatório")
        String nome,

        Long cursoId,
        String cursoNome,
        List<Long> cursoIds,
        List<Long> turmaIds,
        List<String> turmaNomes
) {}