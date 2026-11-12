package com.example.horario_ifpb_monteiro.repository;

import com.example.horario_ifpb_monteiro.entity.Enum.DiaSemana;
import com.example.horario_ifpb_monteiro.entity.Enum.StatusHorario;
import com.example.horario_ifpb_monteiro.entity.Horario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface HorarioRepository extends JpaRepository<Horario, Long> {

    List<Horario> findByTurmaId(Long turmaId);
    List<Horario> findByProfessorId(Long professorId);
    List<Horario> findByAmbienteId(Long ambienteId);
    List<Horario> findByStatus(StatusHorario statusHorario);

    @Query("SELECT MAX(h.dataAtualizacao) FROM Horario h WHERE h.status = 'PUBLICADO'")
    Optional<LocalDateTime> findUltimaDataAtualizacaoPublicada();

    // Validação de choque para o Professor
    @Query("""
        SELECT COUNT(h) > 0 FROM Horario h
        WHERE h.diaSemana = :diaSemana
          AND h.professor.id = :professorId
          AND (:inicio < h.horarioFim AND :fim > h.horarioInicio)
          AND (:id IS NULL OR h.id <> :id)
    """)
    boolean existeConflitoProfessor(
            @Param("diaSemana") DiaSemana diaSemana,
            @Param("inicio") LocalTime inicio,
            @Param("fim") LocalTime fim,
            @Param("professorId") Long professorId,
            @Param("id") Long id
    );

    // Validação de choque para o Ambiente (Sala/Lab)
    @Query("""
        SELECT COUNT(h) > 0 FROM Horario h
        WHERE h.diaSemana = :diaSemana
          AND h.ambiente.id = :ambienteId
          AND (:inicio < h.horarioFim AND :fim > h.horarioInicio)
          AND (:id IS NULL OR h.id <> :id)
    """)
    boolean existeConflitoAmbiente(
            @Param("diaSemana") DiaSemana diaSemana,
            @Param("inicio") LocalTime inicio,
            @Param("fim") LocalTime fim,
            @Param("ambienteId") Long ambienteId,
            @Param("id") Long id
    );

    // Validação de choque para a própria Turma
    @Query("""
        SELECT COUNT(h) > 0 FROM Horario h
        WHERE h.diaSemana = :diaSemana
          AND h.turma.id = :turmaId
          AND (:inicio < h.horarioFim AND :fim > h.horarioInicio)
          AND (:id IS NULL OR h.id <> :id)
    """)
    boolean existeConflitoTurma(
            @Param("diaSemana") DiaSemana diaSemana,
            @Param("inicio") LocalTime inicio,
            @Param("fim") LocalTime fim,
            @Param("turmaId") Long turmaId,
            @Param("id") Long id
    );
}