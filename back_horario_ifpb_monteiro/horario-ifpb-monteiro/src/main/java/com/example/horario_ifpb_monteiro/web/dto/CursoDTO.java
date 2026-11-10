package com.example.horario_ifpb_monteiro.web.dto;

import com.example.horario_ifpb_monteiro.entity.Enum.ModalidadeCurso;
import jakarta.validation.constraints.NotBlank;

public record CursoDTO(
        Long id,

        @NotBlank(message = "O nome do curso é obrigatório")
        String nome,

        @NotBlank(message = "O código do curso é obrigatório")
        String codigo,

        ModalidadeCurso modalidade
) {}