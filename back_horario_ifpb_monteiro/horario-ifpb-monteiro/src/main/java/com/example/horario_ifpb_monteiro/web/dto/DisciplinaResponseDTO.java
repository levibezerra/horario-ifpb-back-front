package com.example.horario_ifpb_monteiro.web.dto;

import com.example.horario_ifpb_monteiro.entity.Curso;
import com.example.horario_ifpb_monteiro.entity.Disciplina;
import com.example.horario_ifpb_monteiro.entity.Turma;

import java.util.List;

public record DisciplinaResponseDTO(
        Long id,
        String nome,
        Long cursoId,
        String cursoNome,
        List<Long> cursoIds,
        List<Long> turmaIds,
        List<String> turmaNomes
) {
    public static DisciplinaResponseDTO fromEntity(Disciplina disciplina) {
        List<Long> cursoIds = disciplina.getCursos() != null && !disciplina.getCursos().isEmpty()
                ? disciplina.getCursos().stream().map(Curso::getId).toList()
                : (disciplina.getCurso() != null ? List.of(disciplina.getCurso().getId()) : List.of());

        List<Long> turmaIds = disciplina.getTurmas() != null
                ? disciplina.getTurmas().stream().map(Turma::getId).toList()
                : List.of();

        List<String> turmaNomes = disciplina.getTurmas() != null
                ? disciplina.getTurmas().stream().map(Turma::getNome).toList()
                : List.of();

        return new DisciplinaResponseDTO(
                disciplina.getId(),
                disciplina.getNome(),
                disciplina.getCurso() != null ? disciplina.getCurso().getId() : null,
                disciplina.getCurso() != null ? disciplina.getCurso().getNome() : null,
                cursoIds,
                turmaIds,
                turmaNomes
        );
    }
}