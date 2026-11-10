package com.example.horario_ifpb_monteiro.web.controller;

import com.example.horario_ifpb_monteiro.entity.Curso;
import com.example.horario_ifpb_monteiro.service.CursoService;
import com.example.horario_ifpb_monteiro.web.dto.CursoDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cursos")
public class CursoController {

    private final CursoService service;

    public CursoController(CursoService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<CursoDTO>> listarTodos() {
        List<CursoDTO> list = service.listarTodos().stream()
                .map(c -> new CursoDTO(c.getId(), c.getNome(), c.getCodigo()))
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CursoDTO> buscarPorId(@PathVariable Long id) {
        Curso c = service.buscarPorId(id);
        return ResponseEntity.ok(new CursoDTO(c.getId(), c.getNome(), c.getCodigo()));
    }

    @PostMapping
    public ResponseEntity<CursoDTO> criar(@RequestBody @Valid CursoDTO dto) {
        Curso c = Curso.builder().nome(dto.nome()).codigo(dto.codigo()).build();
        Curso salvo = service.salvar(c);
        return ResponseEntity.status(HttpStatus.CREATED).body(new CursoDTO(salvo.getId(), salvo.getNome(), salvo.getCodigo()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CursoDTO> atualizar(@PathVariable Long id, @RequestBody @Valid CursoDTO dto) {
        Curso c = Curso.builder().nome(dto.nome()).codigo(dto.codigo()).build();
        Curso atualizado = service.atualizar(id, c);
        return ResponseEntity.ok(new CursoDTO(atualizado.getId(), atualizado.getNome(), atualizado.getCodigo()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
