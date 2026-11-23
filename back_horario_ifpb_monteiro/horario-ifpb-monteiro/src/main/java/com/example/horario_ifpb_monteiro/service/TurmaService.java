package com.example.horario_ifpb_monteiro.service;

import com.example.horario_ifpb_monteiro.entity.Turma;
import com.example.horario_ifpb_monteiro.exceptions.BusinessException;
import com.example.horario_ifpb_monteiro.exceptions.ResourceNotFoundException;
import com.example.horario_ifpb_monteiro.repository.HorarioRepository;
import com.example.horario_ifpb_monteiro.repository.TurmaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TurmaService {

    private final TurmaRepository repository;
    private final CursoService cursoService;
    private final HorarioRepository horarioRepository;

    public TurmaService(
            TurmaRepository repository,
            CursoService cursoService,
            HorarioRepository horarioRepository
    ) {
        this.repository = repository;
        this.cursoService = cursoService;
        this.horarioRepository = horarioRepository;
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
        Turma turma = buscarPorId(id);

        long totalHorarios = horarioRepository.countByTurmaId(id);
        if (totalHorarios > 0) {
            throw new BusinessException(
                    "Não é possível excluir a turma \"" + turma.getNome() + "\" porque existem "
                            + totalHorarios + " horário(s) vinculados a ela. Remova os horários antes de excluir."
            );
        }

        repository.delete(turma);
    }
}