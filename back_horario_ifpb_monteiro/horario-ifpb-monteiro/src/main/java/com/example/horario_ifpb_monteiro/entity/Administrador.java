package com.example.horario_ifpb_monteiro.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "administradores")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Administrador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String senha;
}