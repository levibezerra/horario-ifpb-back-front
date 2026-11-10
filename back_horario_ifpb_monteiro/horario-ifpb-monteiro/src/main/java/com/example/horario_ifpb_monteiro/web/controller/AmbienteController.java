package com.example.horario_ifpb_monteiro.web.controller;

import com.example.horario_ifpb_monteiro.entity.Ambiente;
import com.example.horario_ifpb_monteiro.service.AmbienteService;
import com.example.horario_ifpb_monteiro.web.dto.AmbienteDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ambientes")
public class AmbienteController {

    private final AmbienteService service;

    public AmbienteController(AmbienteService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<AmbienteDTO>> listarTodos() {
        List<AmbienteDTO> list = service.listarTodos().stream()
                .map(a -> new AmbienteDTO(a.getId(), a.getNome(), a.getCategoria(), a.getLocalizacao()))
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AmbienteDTO> buscarPorId(@PathVariable Long id) {
        Ambiente a = service.buscarPorId(id);
        return ResponseEntity.ok(new AmbienteDTO(a.getId(), a.getNome(), a.getCategoria(), a.getLocalizacao()));
    }

    @PostMapping
    public ResponseEntity<AmbienteDTO> criar(@RequestBody @Valid AmbienteDTO dto) {
        Ambiente a = Ambiente.builder()
                .nome(dto.nome())
                .categoria(dto.categoria())
                .localizacao(dto.localizacao())
                .build();
        Ambiente salvo = service.salvar(a);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AmbienteDTO(salvo.getId(), salvo.getNome(), salvo.getCategoria(), salvo.getLocalizacao()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AmbienteDTO> atualizar(@PathVariable Long id, @RequestBody @Valid AmbienteDTO dto) {
        Ambiente a = Ambiente.builder()
                .nome(dto.nome())
                .categoria(dto.categoria())
                .localizacao(dto.localizacao())
                .build();
        Ambiente atualizado = service.atualizar(id, a);
        return ResponseEntity.ok(new AmbienteDTO(atualizado.getId(), atualizado.getNome(), atualizado.getCategoria(), atualizado.getLocalizacao()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}