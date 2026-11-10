package com.example.horario_ifpb_monteiro.web.controller;

import com.example.horario_ifpb_monteiro.entity.Curso;
import com.example.horario_ifpb_monteiro.entity.Professor;
import com.example.horario_ifpb_monteiro.service.ProfessorService;
import com.example.horario_ifpb_monteiro.web.dto.ProfessorDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/professores")
public class ProfessorController {

    private final ProfessorService service;

    public ProfessorController(ProfessorService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ProfessorDTO>> listarTodos() {
        List<ProfessorDTO> list = service.listarTodos().stream()
                .map(this::toDTO)
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProfessorDTO> buscarPorId(@PathVariable Long id) {
        Professor p = service.buscarPorId(id);
        return ResponseEntity.ok(toDTO(p));
    }

    @PostMapping
    public ResponseEntity<ProfessorDTO> criar(@RequestBody @Valid ProfessorDTO dto) {
        Professor p = Professor.builder()
                .nome(dto.nome())
                .email(dto.email())
                .lattesUrl(dto.lattesUrl())
                .build();

        Professor salvo = service.salvar(p, dto.cursosIds());
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(salvo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProfessorDTO> atualizar(@PathVariable Long id, @RequestBody @Valid ProfessorDTO dto) {
        Professor p = Professor.builder()
                .nome(dto.nome())
                .email(dto.email())
                .lattesUrl(dto.lattesUrl())
                .build();

        Professor atualizado = service.atualizar(id, p, dto.cursosIds());
        return ResponseEntity.ok(toDTO(atualizado));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }

    private ProfessorDTO toDTO(Professor p) {
        var cursosIds = p.getCursos().stream().map(Curso::getId).collect(Collectors.toSet());
        var cursosNomes = p.getCursos().stream().map(Curso::getNome).collect(Collectors.toSet());

        return new ProfessorDTO(
                p.getId(),
                p.getNome(),
                p.getEmail(),
                p.getLattesUrl(),
                cursosIds,
                cursosNomes
        );
    }
}