package com.example.horario_ifpb_monteiro.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ano_letivo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnoLetivo {

    @Id
    private Long id = 1L;

    @Column(name = "periodo_letivo", nullable = false, length = 10)
    private String periodoLetivo = "2026.2";
}
