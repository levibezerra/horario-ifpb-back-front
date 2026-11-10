package com.example.horario_ifpb_monteiro.web.dto;

import com.example.horario_ifpb_monteiro.entity.Enum.CategoriaAmbiente;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AmbienteDTO(
        Long id,

        @NotBlank(message = "O nome do ambiente é obrigatório")
        String nome,

        @NotNull(message = "A categoria é obrigatória")
        CategoriaAmbiente categoria,

        String localizacao
) {}