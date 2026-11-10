package com.example.horario_ifpb_monteiro.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "turmas")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Turma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curso_id", nullable = false)
    private Curso curso;
}