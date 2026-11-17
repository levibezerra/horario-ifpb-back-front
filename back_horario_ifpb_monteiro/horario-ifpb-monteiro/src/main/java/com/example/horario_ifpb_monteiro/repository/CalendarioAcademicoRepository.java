package com.example.horario_ifpb_monteiro.repository;

import com.example.horario_ifpb_monteiro.entity.CalendarioAcademico;

import com.example.horario_ifpb_monteiro.entity.Enum.StatusCalendarioAcademico;
import com.example.horario_ifpb_monteiro.entity.Enum.TipoCalendarioAcademico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CalendarioAcademicoRepository extends JpaRepository<CalendarioAcademico, Long> {

    List<CalendarioAcademico> findAllByOrderByCriadoEmDesc();

    List<CalendarioAcademico> findAllByStatusOrderByCriadoEmDesc(StatusCalendarioAcademico status);

    Optional<CalendarioAcademico> findFirstByStatusOrderByCriadoEmDesc(StatusCalendarioAcademico status);

    Optional<CalendarioAcademico> findFirstByTipoAndStatusOrderByCriadoEmDesc(
            TipoCalendarioAcademico tipo,
            StatusCalendarioAcademico status
    );

    List<CalendarioAcademico> findAllByTipo(TipoCalendarioAcademico tipo);
}