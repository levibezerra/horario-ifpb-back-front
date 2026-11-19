package com.example.horario_ifpb_monteiro.web.controller;

import com.example.horario_ifpb_monteiro.service.AnoLetivoService;
import com.example.horario_ifpb_monteiro.web.dto.AnoLetivoDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ano-letivo")
@RequiredArgsConstructor
public class AnoLetivoController {

    private final AnoLetivoService service;

    @GetMapping
    public ResponseEntity<AnoLetivoDTO> obterPeriodoLetivo() {
        return ResponseEntity.ok(service.obterPeriodoLetivo());
    }

    @PutMapping
    public ResponseEntity<AnoLetivoDTO> atualizarPeriodoLetivo(@RequestBody AnoLetivoDTO dto) {
        return ResponseEntity.ok(service.atualizarPeriodoLetivo(dto));
    }
}
