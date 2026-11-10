package com.example.horario_ifpb_monteiro.service;

import com.example.horario_ifpb_monteiro.entity.Turma;
import com.example.horario_ifpb_monteiro.exceptions.ResourceNotFoundException;
import com.example.horario_ifpb_monteiro.repository.TurmaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TurmaService {

    private final TurmaRepository repository;
    private final CursoService cursoService;

    public TurmaService(TurmaRepository repository, CursoService cursoService) {
        this.repository = repository;
        this.cursoService = cursoService;
    }

    @Transactional(readOnly = true)
    public List<Turma> listarTodos() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Turma buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada com o ID: " + id));
    }

    @Transactional
    public Turma salvar(Turma turma) {
        cursoService.buscarPorId(turma.getCurso().getId());
        return repository.save(turma);
    }

    @Transactional
    public Turma atualizar(Long id, Turma turmaAtualizada) {
        Turma turmaExistente = buscarPorId(id);
        cursoService.buscarPorId(turmaAtualizada.getCurso().getId());

        turmaExistente.setNome(turmaAtualizada.getNome());
        turmaExistente.setCurso(turmaAtualizada.getCurso());

        return repository.save(turmaExistente);
    }

    @Transactional
    public void deletar(Long id) {
        buscarPorId(id);
        repository.deleteById(id);
    }
}