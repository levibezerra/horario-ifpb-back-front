package com.example.horario_ifpb_monteiro.web.dto;

import com.example.horario_ifpb_monteiro.entity.Enum.DiaSemana;
import com.example.horario_ifpb_monteiro.entity.Enum.StatusHorario;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDateTime;
import java.time.LocalTime;

public record HorarioDTO(
        Long id,

        @NotNull(message = "O dia da semana é obrigatório")
        DiaSemana diaSemana,

        @NotNull(message = "O horário de início é obrigatório")
        LocalTime horarioInicio,

        @NotNull(message = "O horário de término é obrigatório")
        LocalTime horarioFim,

        @NotBlank(message = "O período letivo é obrigatório")
        @Pattern(regexp = "^\\d{4}\\.[12]$", message = "O período letivo deve seguir o padrão AAAA.1 ou AAAA.2 (ex: 2027.1)")
        String periodoLetivo,

        StatusHorario status, // RASCUNHO ou PUBLICADO

        @NotNull(message = "O ID do professor é obrigatório")
        Long professorId,
        String professorNome,

        @NotNull(message = "O ID da turma é obrigatório")
        Long turmaId,
        String turmaNome,

        Long cursoId,
        String cursoNome,

        @NotNull(message = "O ID da disciplina é obrigatório")
        Long disciplinaId,
        String disciplinaNome,

        @NotNull(message = "O ID do ambiente é obrigatório")
        Long ambienteId,
        String ambienteNome,

        LocalDateTime dataAtualizacao
) {}