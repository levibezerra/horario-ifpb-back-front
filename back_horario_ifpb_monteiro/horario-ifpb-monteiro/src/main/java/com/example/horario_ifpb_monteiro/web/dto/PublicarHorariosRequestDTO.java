package com.example.horario_ifpb_monteiro.web.dto;

import java.util.List;

public record PublicarHorariosRequestDTO(
        List<Long> horarioIds
) {}