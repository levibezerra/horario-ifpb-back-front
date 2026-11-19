package com.example.horario_ifpb_monteiro.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record DisciplinaRequestDTO(
        @NotBlank(message = "O nome da disciplina é obrigatório")
        String nome,

        Long cursoId,

        List<Long> cursoIds,

        @NotEmpty(message = "Selecione ao menos uma turma vinculada")
        List<Long> turmaIds
) {
    public List<Long> resolverCursoIds() {
        if (cursoIds != null && !cursoIds.isEmpty()) {
            return cursoIds;
        }
        return cursoId != null ? List.of(cursoId) : List.of();
    }
}