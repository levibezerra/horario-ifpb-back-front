package com.example.horario_ifpb_monteiro.web.dto;

import com.example.horario_ifpb_monteiro.entity.Disciplina;

public record DisciplinaResponseDTO(
        Long id,
        String nome,
        Long cursoId,
        String cursoNome
) {
    public static DisciplinaResponseDTO fromEntity(Disciplina disciplina) {
        return new DisciplinaResponseDTO(
                disciplina.getId(),
                disciplina.getNome(),
                disciplina.getCurso() != null ? disciplina.getCurso().getId() : null,
                disciplina.getCurso() != null ? disciplina.getCurso().getNome() : null
        );
    }
}