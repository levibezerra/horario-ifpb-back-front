package com.example.horario_ifpb_monteiro.web.controller;

import com.example.horario_ifpb_monteiro.entity.Disciplina;
import com.example.horario_ifpb_monteiro.service.DisciplinaService;
import com.example.horario_ifpb_monteiro.web.dto.DisciplinaDTO;
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
    public ResponseEntity<List<DisciplinaDTO>> listarTodos() {
        List<DisciplinaDTO> list = service.listarTodos().stream()
                .map(d -> new DisciplinaDTO(d.getId(), d.getNome()))
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DisciplinaDTO> buscarPorId(@PathVariable Long id) {
        Disciplina d = service.buscarPorId(id);
        return ResponseEntity.ok(new DisciplinaDTO(d.getId(), d.getNome()));
    }

    @PostMapping
    public ResponseEntity<DisciplinaDTO> criar(@RequestBody @Valid DisciplinaDTO dto) {
        Disciplina d = Disciplina.builder()
                .nome(dto.nome())
                .build();
        Disciplina salva = service.salvar(d);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new DisciplinaDTO(salva.getId(), salva.getNome()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DisciplinaDTO> atualizar(@PathVariable Long id, @RequestBody @Valid DisciplinaDTO dto) {
        Disciplina d = Disciplina.builder()
                .nome(dto.nome())
                .build();
        Disciplina atualizada = service.atualizar(id, d);
        return ResponseEntity.ok(new DisciplinaDTO(atualizada.getId(), atualizada.getNome()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}