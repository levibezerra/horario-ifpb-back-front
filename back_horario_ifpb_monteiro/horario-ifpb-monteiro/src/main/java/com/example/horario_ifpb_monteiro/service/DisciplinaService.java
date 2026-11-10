package com.example.horario_ifpb_monteiro.service;

import com.example.horario_ifpb_monteiro.entity.Disciplina;
import com.example.horario_ifpb_monteiro.exceptions.ResourceNotFoundException;
import com.example.horario_ifpb_monteiro.repository.DisciplinaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DisciplinaService {

    private final DisciplinaRepository repository;

    public DisciplinaService(DisciplinaRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Disciplina> listarTodos() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Disciplina buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada com o ID: " + id));
    }

    @Transactional
    public Disciplina salvar(Disciplina disciplina) {
        return repository.save(disciplina);
    }

    @Transactional
    public Disciplina atualizar(Long id, Disciplina disciplinaAtualizada) {
        Disciplina disciplinaExistente = buscarPorId(id);
        disciplinaExistente.setNome(disciplinaAtualizada.getNome());
        return repository.save(disciplinaExistente);
    }

    @Transactional
    public void deletar(Long id) {
        buscarPorId(id);
        repository.deleteById(id);
    }
}