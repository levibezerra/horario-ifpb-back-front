package com.example.horario_ifpb_monteiro.service;

import com.example.horario_ifpb_monteiro.entity.AnoLetivo;
import com.example.horario_ifpb_monteiro.exceptions.BusinessException;
import com.example.horario_ifpb_monteiro.repository.AnoLetivoRepository;
import com.example.horario_ifpb_monteiro.web.dto.AnoLetivoDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AnoLetivoService {

    private static final Long CONFIG_ID = 1L;
    private static final String PERIODO_PADRAO = "2026.2";
    private static final String REGEX_PERIODO = "^\\d{4}\\.[12]$";

    private final AnoLetivoRepository repository;

    @Transactional
    public AnoLetivoDTO obterPeriodoLetivo() {
        AnoLetivo config = repository.findById(CONFIG_ID)
                .orElseGet(() -> repository.save(new AnoLetivo(CONFIG_ID, PERIODO_PADRAO)));

        return new AnoLetivoDTO(config.getPeriodoLetivo());
    }

    @Transactional
    public AnoLetivoDTO atualizarPeriodoLetivo(AnoLetivoDTO dto) {
        if (dto == null || dto.periodoLetivo() == null || dto.periodoLetivo().isBlank()) {
            throw new BusinessException("O ano letivo deve ser informado.");
        }

        String periodoLimpo = dto.periodoLetivo().trim();
        if (!periodoLimpo.matches(REGEX_PERIODO)) {
            throw new BusinessException("Formato inválido. Utilize ex.: 2027.1");
        }

        AnoLetivo config = repository.findById(CONFIG_ID).orElse(new AnoLetivo(CONFIG_ID, periodoLimpo));

        config.setPeriodoLetivo(periodoLimpo);
        repository.save(config);

        return new AnoLetivoDTO(config.getPeriodoLetivo());
    }
}
