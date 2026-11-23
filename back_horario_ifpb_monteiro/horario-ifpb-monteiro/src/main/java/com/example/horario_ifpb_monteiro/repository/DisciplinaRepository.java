package com.example.horario_ifpb_monteiro.repository;

import com.example.horario_ifpb_monteiro.entity.Disciplina;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DisciplinaRepository extends JpaRepository<Disciplina, Long> {

    @Override
    @EntityGraph(attributePaths = {"curso", "cursos", "turmas"})
    List<Disciplina> findAll();

    @Override
    @EntityGraph(attributePaths = {"curso", "cursos", "turmas"})
    Optional<Disciplina> findById(Long id);

    long countByTurmasId(Long turmaId);
}