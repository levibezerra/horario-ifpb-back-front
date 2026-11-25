package com.example.horario_ifpb_monteiro.web.dto;

import java.util.List;

public record DespublicarHorariosRequestDTO(
        List<Long> horarioIds,
        Long turmaId
) {}