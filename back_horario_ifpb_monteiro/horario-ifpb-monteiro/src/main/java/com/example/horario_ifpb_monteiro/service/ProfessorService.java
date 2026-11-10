package com.example.horario_ifpb_monteiro.service;

import com.example.horario_ifpb_monteiro.entity.Curso;
import com.example.horario_ifpb_monteiro.entity.Professor;
import com.example.horario_ifpb_monteiro.exceptions.BusinessException;
import com.example.horario_ifpb_monteiro.exceptions.ResourceNotFoundException;
import com.example.horario_ifpb_monteiro.repository.CursoRepository;
import com.example.horario_ifpb_monteiro.repository.ProfessorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ProfessorService {

    private final ProfessorRepository repository;
    private final CursoRepository cursoRepository;

    public ProfessorService(ProfessorRepository repository, CursoRepository cursoRepository) {
        this.repository = repository;
        this.cursoRepository = cursoRepository;
    }

    @Transactional(readOnly = true)
    public List<Professor> listarTodos() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Professor buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Professor não encontrado com o ID: " + id));
    }

    @Transactional
    public Professor salvar(Professor professor, Set<Long> cursosIds) {
        if (repository.existsByEmail(professor.getEmail())) {
            throw new BusinessException("Já existe um professor cadastrado com este e-mail.");
        }

        vincularCursos(professor, cursosIds);
        return repository.save(professor);
    }

    @Transactional
    public Professor atualizar(Long id, Professor professorAtualizado, Set<Long> cursosIds) {
        Professor professorExistente = buscarPorId(id);

        if (!professorExistente.getEmail().equalsIgnoreCase(professorAtualizado.getEmail()) &&
                repository.existsByEmail(professorAtualizado.getEmail())) {
            throw new BusinessException("O e-mail informado já pertence a outro professor.");
        }

        professorExistente.setNome(professorAtualizado.getNome());
        professorExistente.setEmail(professorAtualizado.getEmail());
        professorExistente.setLattesUrl(professorAtualizado.getLattesUrl());

        vincularCursos(professorExistente, cursosIds);
        return repository.save(professorExistente);
    }

    @Transactional
    public void deletar(Long id) {
        buscarPorId(id);
        repository.deleteById(id);
    }

    private void vincularCursos(Professor professor, Set<Long> cursosIds) {
        if (cursosIds != null && !cursosIds.isEmpty()) {
            List<Curso> cursosEncontrados = cursoRepository.findAllById(cursosIds);
            professor.setCursos(new HashSet<>(cursosEncontrados));
        } else {
            professor.getCursos().clear();
        }
    }
}