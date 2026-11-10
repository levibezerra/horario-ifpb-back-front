package com.example.horario_ifpb_monteiro.service;

import com.example.horario_ifpb_monteiro.entity.Curso;
import com.example.horario_ifpb_monteiro.exceptions.BusinessException;
import com.example.horario_ifpb_monteiro.exceptions.ResourceNotFoundException;
import com.example.horario_ifpb_monteiro.repository.CursoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CursoService {

    private final CursoRepository repository;

    public CursoService(CursoRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Curso> listarTodos() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Curso buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Curso não encontrado com o ID: " + id));
    }

    @Transactional
    public Curso salvar(Curso curso) {
        if (repository.existsByCodigo(curso.getCodigo())) {
            throw new BusinessException("Já existe um curso cadastrado com este código.");
        }
        return repository.save(curso);
    }

    @Transactional
    public Curso atualizar(Long id, Curso cursoAtualizado) {
        Curso cursoExistente = buscarPorId(id);

        if (!cursoExistente.getCodigo().equalsIgnoreCase(cursoAtualizado.getCodigo()) &&
                repository.existsByCodigo(cursoAtualizado.getCodigo())) {
            throw new BusinessException("O código informado já pertence a outro curso.");
        }

        cursoExistente.setNome(cursoAtualizado.getNome());
        cursoExistente.setCodigo(cursoAtualizado.getCodigo());

        return repository.save(cursoExistente);
    }

    @Transactional
    public void deletar(Long id) {
        buscarPorId(id);
        repository.deleteById(id);
    }
}