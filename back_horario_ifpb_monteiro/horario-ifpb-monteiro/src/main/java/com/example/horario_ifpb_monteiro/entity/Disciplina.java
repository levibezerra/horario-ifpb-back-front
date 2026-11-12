package com.example.horario_ifpb_monteiro.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "disciplinas")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Disciplina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "curso_id", nullable = false)
    private Curso curso;
}