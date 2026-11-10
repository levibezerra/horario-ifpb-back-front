package com.example.horario_ifpb_monteiro.entity;

import com.example.horario_ifpb_monteiro.entity.Enum.CategoriaAmbiente;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ambientes")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Ambiente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CategoriaAmbiente categoria;

    @Column(length = 100)
    private String localizacao;
}