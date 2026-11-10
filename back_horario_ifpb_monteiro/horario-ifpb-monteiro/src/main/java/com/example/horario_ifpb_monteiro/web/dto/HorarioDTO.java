package com.example.horario_ifpb_monteiro.web.dto;

import com.example.horario_ifpb_monteiro.entity.Enum.DiaSemana;
import com.example.horario_ifpb_monteiro.entity.Enum.StatusHorario;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record HorarioDTO(
        Long id,

        @NotNull(message = "O dia da semana é obrigatório")
        DiaSemana diaSemana,

        @NotNull(message = "O horário de início é obrigatório")
        LocalTime horarioInicio,

        @NotNull(message = "O horário de término é obrigatório")
        LocalTime horarioFim,

        StatusHorario status, // RASCUNHO ou PUBLICADO

        @NotNull(message = "O ID do professor é obrigatório")
        Long professorId,
        String professorNome,

        @NotNull(message = "O ID da turma é obrigatório")
        Long turmaId,
        String turmaNome,

        @NotNull(message = "O ID da disciplina é obrigatório")
        Long disciplinaId,
        String disciplinaNome,

        @NotNull(message = "O ID do ambiente é obrigatório")
        Long ambienteId,
        String ambienteNome
) {}