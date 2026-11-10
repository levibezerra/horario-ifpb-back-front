package com.example.horario_ifpb_monteiro.web.controller;

import com.example.horario_ifpb_monteiro.entity.Curso;
import com.example.horario_ifpb_monteiro.entity.Turma;
import com.example.horario_ifpb_monteiro.service.TurmaService;
import com.example.horario_ifpb_monteiro.web.dto.TurmaDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/turmas")
public class TurmaController {

    private final TurmaService service;

    public TurmaController(TurmaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<TurmaDTO>> listarTodos() {
        List<TurmaDTO> list = service.listarTodos().stream()
                .map(t -> new TurmaDTO(t.getId(), t.getNome(), t.getCurso().getId(), t.getCurso().getNome()))
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TurmaDTO> buscarPorId(@PathVariable Long id) {
        Turma t = service.buscarPorId(id);
        return ResponseEntity.ok(new TurmaDTO(t.getId(), t.getNome(), t.getCurso().getId(), t.getCurso().getNome()));
    }

    @PostMapping
    public ResponseEntity<TurmaDTO> criar(@RequestBody @Valid TurmaDTO dto) {
        Turma t = Turma.builder()
                .nome(dto.nome())
                .curso(Curso.builder().id(dto.cursoId()).build())
                .build();
        Turma salva = service.salvar(t);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new TurmaDTO(salva.getId(), salva.getNome(), salva.getCurso().getId(), salva.getCurso().getNome()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TurmaDTO> atualizar(@PathVariable Long id, @RequestBody @Valid TurmaDTO dto) {
        Turma t = Turma.builder()
                .nome(dto.nome())
                .curso(Curso.builder().id(dto.cursoId()).build())
                .build();
        Turma atualizada = service.atualizar(id, t);
        return ResponseEntity.ok(new TurmaDTO(atualizada.getId(), atualizada.getNome(), atualizada.getCurso().getId(), atualizada.getCurso().getNome()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}