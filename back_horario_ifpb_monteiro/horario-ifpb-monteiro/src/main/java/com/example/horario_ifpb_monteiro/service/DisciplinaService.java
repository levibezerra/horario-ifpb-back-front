package com.example.horario_ifpb_monteiro.service;

import com.example.horario_ifpb_monteiro.entity.Curso;
import com.example.horario_ifpb_monteiro.entity.Disciplina;
import com.example.horario_ifpb_monteiro.exceptions.ResourceNotFoundException;
import com.example.horario_ifpb_monteiro.repository.CursoRepository;
import com.example.horario_ifpb_monteiro.repository.DisciplinaRepository;
import com.example.horario_ifpb_monteiro.web.dto.DisciplinaRequestDTO;
import com.example.horario_ifpb_monteiro.web.dto.DisciplinaResponseDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DisciplinaService {

    private final DisciplinaRepository repository;
    private final CursoRepository cursoRepository;

    public DisciplinaService(DisciplinaRepository repository, CursoRepository cursoRepository) {
        this.repository = repository;
        this.cursoRepository = cursoRepository;
    }

    @Transactional(readOnly = true)
    public List<DisciplinaResponseDTO> listarTodos() {
        return repository.findAll()
                .stream()
                .map(DisciplinaResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Disciplina buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o ID: " + id));
    }

    @Transactional(readOnly = true)
    public DisciplinaResponseDTO buscarDtoPorId(Long id) {
        return DisciplinaResponseDTO.fromEntity(buscarPorId(id));
    }

    @Transactional
    public DisciplinaResponseDTO salvar(DisciplinaRequestDTO dto) {
        Curso curso = cursoRepository.findById(dto.cursoId())
                .orElseThrow(() -> new ResourceNotFoundException("Curso não encontrado com o ID: " + dto.cursoId()));

        Disciplina disciplina = Disciplina.builder()
                .nome(dto.nome())
                .curso(curso)
                .build();

        return DisciplinaResponseDTO.fromEntity(repository.save(disciplina));
    }

    @Transactional
    public DisciplinaResponseDTO atualizar(Long id, DisciplinaRequestDTO dto) {
        Disciplina disciplinaExistente = buscarPorId(id);

        Curso curso = cursoRepository.findById(dto.cursoId())
                .orElseThrow(() -> new ResourceNotFoundException("Curso não encontrado com o ID: " + dto.cursoId()));

        disciplinaExistente.setNome(dto.nome());
        disciplinaExistente.setCurso(curso);

        return DisciplinaResponseDTO.fromEntity(repository.save(disciplinaExistente));
    }

    @Transactional
    public void deletar(Long id) {
        buscarPorId(id);
        repository.deleteById(id);
    }
}