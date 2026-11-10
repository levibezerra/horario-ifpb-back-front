package com.example.horario_ifpb_monteiro.repository;

import com.example.horario_ifpb_monteiro.entity.Disciplina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DisciplinaRepository extends JpaRepository<Disciplina, Long> {
}