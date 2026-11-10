package com.example.horario_ifpb_monteiro.web.controller;

import com.example.horario_ifpb_monteiro.entity.*;
import com.example.horario_ifpb_monteiro.entity.Enum.StatusHorario;
import com.example.horario_ifpb_monteiro.service.HorarioService;
import com.example.horario_ifpb_monteiro.web.dto.HorarioDTO;
import com.example.horario_ifpb_monteiro.web.dto.PublicarHorariosRequestDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/horarios")
public class HorarioController {

    private final HorarioService horarioService;

    public HorarioController(HorarioService horarioService) {
        this.horarioService = horarioService;
    }

    @GetMapping
    public ResponseEntity<List<HorarioDTO>> listarTodos() {
        return ResponseEntity.ok(horarioService.listarTodos().stream().map(this::converterParaDto).toList());
    }

    @GetMapping("/turma/{turmaId}")
    public ResponseEntity<List<HorarioDTO>> buscarPorTurma(@PathVariable Long turmaId) {
        return ResponseEntity.ok(horarioService.buscarPorTurma(turmaId).stream().map(this::converterParaDto).toList());
    }

    @GetMapping("/professor/{professorId}")
    public ResponseEntity<List<HorarioDTO>> buscarPorProfessor(@PathVariable Long professorId) {
        return ResponseEntity.ok(horarioService.buscarPorProfessor(professorId).stream().map(this::converterParaDto).toList());
    }

    @GetMapping("/ambiente/{ambienteId}")
    public ResponseEntity<List<HorarioDTO>> buscarPorAmbiente(@PathVariable Long ambienteId) {
        return ResponseEntity.ok(horarioService.buscarPorAmbiente(ambienteId).stream().map(this::converterParaDto).toList());
    }

    @PostMapping
    public ResponseEntity<HorarioDTO> criar(@RequestBody @Valid HorarioDTO dto) {
        Horario horario = Horario.builder()
                .diaSemana(dto.diaSemana())
                .horarioInicio(dto.horarioInicio())
                .horarioFim(dto.horarioFim())
                .status(dto.status() != null ? dto.status() : StatusHorario.RASCUNHO)
                .professor(Professor.builder().id(dto.professorId()).build())
                .turma(Turma.builder().id(dto.turmaId()).build())
                .disciplina(Disciplina.builder().id(dto.disciplinaId()).build())
                .ambiente(Ambiente.builder().id(dto.ambienteId()).build())
                .build();

        Horario salvo = horarioService.salvar(horario);
        return ResponseEntity.status(HttpStatus.CREATED).body(converterParaDto(salvo));
    }

    @PostMapping("/publicar")
    public ResponseEntity<Void> publicarHorarios(@RequestBody(required = false) PublicarHorariosRequestDTO dto) {
        List<Long> ids = (dto != null) ? dto.horarioIds() : null;
        horarioService.publicarHorarios(ids);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        horarioService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    private HorarioDTO converterParaDto(Horario h) {
        return new HorarioDTO(
                h.getId(),
                h.getDiaSemana(),
                h.getHorarioInicio(),
                h.getHorarioFim(),
                h.getStatus(),
                h.getProfessor().getId(),
                h.getProfessor().getNome(),
                h.getTurma().getId(),
                h.getTurma().getNome(),
                h.getDisciplina().getId(),
                h.getDisciplina().getNome(),
                h.getAmbiente().getId(),
                h.getAmbiente().getNome()
        );
    }
}