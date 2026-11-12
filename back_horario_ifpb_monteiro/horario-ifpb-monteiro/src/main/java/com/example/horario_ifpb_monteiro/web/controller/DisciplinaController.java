package com.example.horario_ifpb_monteiro.web.controller;

import com.example.horario_ifpb_monteiro.service.DisciplinaService;
import com.example.horario_ifpb_monteiro.web.dto.DisciplinaRequestDTO;
import com.example.horario_ifpb_monteiro.web.dto.DisciplinaResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/disciplinas")
public class DisciplinaController {

    private final DisciplinaService service;

    public DisciplinaController(DisciplinaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<DisciplinaResponseDTO>> listarTodos() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DisciplinaResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarDtoPorId(id));
    }

    @PostMapping
    public ResponseEntity<DisciplinaResponseDTO> criar(@RequestBody @Valid DisciplinaRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.salvar(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DisciplinaResponseDTO> atualizar(@PathVariable Long id, @RequestBody @Valid DisciplinaRequestDTO dto) {
        return ResponseEntity.ok(service.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}