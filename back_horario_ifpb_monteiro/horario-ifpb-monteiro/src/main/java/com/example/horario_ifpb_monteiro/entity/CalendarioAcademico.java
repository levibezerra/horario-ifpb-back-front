package com.example.horario_ifpb_monteiro.entity;

import com.example.horario_ifpb_monteiro.entity.Enum.StatusCalendarioAcademico;
import com.example.horario_ifpb_monteiro.entity.Enum.TipoCalendarioAcademico;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "calendarios_academicos")
public class CalendarioAcademico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoCalendarioAcademico tipo = TipoCalendarioAcademico.SUPERIOR;

    @Column(nullable = false)
    private String nomeArquivo;

    @Column(nullable = false)
    private String caminhoArquivo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusCalendarioAcademico status = StatusCalendarioAcademico.RASCUNHO;

    @Column(nullable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();
}