package com.example.horario_ifpb_monteiro.service;

import com.example.horario_ifpb_monteiro.entity.*;
import com.example.horario_ifpb_monteiro.entity.Enum.StatusHorario;
import com.example.horario_ifpb_monteiro.exceptions.BusinessException;
import com.example.horario_ifpb_monteiro.exceptions.ResourceNotFoundException;
import com.example.horario_ifpb_monteiro.repository.HorarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HorarioService {

    private final HorarioRepository horarioRepository;
    private final ProfessorService professorService;
    private final TurmaService turmaService;
    private final DisciplinaService disciplinaService;
    private final AmbienteService ambienteService;

    public HorarioService(HorarioRepository horarioRepository,
                          ProfessorService professorService,
                          TurmaService turmaService,
                          DisciplinaService disciplinaService,
                          AmbienteService ambienteService) {
        this.horarioRepository = horarioRepository;
        this.professorService = professorService;
        this.turmaService = turmaService;
        this.disciplinaService = disciplinaService;
        this.ambienteService = ambienteService;
    }

    @Transactional(readOnly = true)
    public List<Horario> listarTodos() {
        return horarioRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Horario> buscarPorTurma(Long turmaId) {
        return horarioRepository.findByTurmaId(turmaId);
    }

    @Transactional(readOnly = true)
    public List<Horario> buscarPorProfessor(Long professorId) {
        return horarioRepository.findByProfessorId(professorId);
    }

    @Transactional(readOnly = true)
    public List<Horario> buscarPorAmbiente(Long ambienteId) {
        return horarioRepository.findByAmbienteId(ambienteId);
    }

    @Transactional
    public Horario salvar(Horario horario) {
        validarHorarioInicioEFim(horario);
        validarEntidades(horario);
        validarConflitos(horario);
        return horarioRepository.save(horario);
    }

    @Transactional
    public void deletar(Long id) {
        if (!horarioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Horário não encontrado com o ID: " + id);
        }
        horarioRepository.deleteById(id);
    }

    @Transactional
    public void publicarHorarios(List<Long> horarioIds) {
        if (horarioIds == null || horarioIds.isEmpty()) {
            // Se a lista vier vazia, publica todos os horários que estão como RASCUNHO
            List<Horario> rascunhos = horarioRepository.findByStatus(StatusHorario.RASCUNHO);
            rascunhos.forEach(h -> h.setStatus(StatusHorario.PUBLICADO));
            horarioRepository.saveAll(rascunhos);
        } else {
            // Publica apenas os horários específicos passados na lista
            List<Horario> horarios = horarioRepository.findAllById(horarioIds);
            horarios.forEach(h -> h.setStatus(StatusHorario.PUBLICADO));
            horarioRepository.saveAll(horarios);
        }
    }

    private void validarHorarioInicioEFim(Horario horario) {
        if (!horario.getHorarioFim().isAfter(horario.getHorarioInicio())) {
            throw new BusinessException("O horário de término deve ser posterior ao horário de início.");
        }
    }

    private void validarEntidades(Horario horario) {
        Professor prof = professorService.buscarPorId(horario.getProfessor().getId());
        Turma turma = turmaService.buscarPorId(horario.getTurma().getId());
        disciplinaService.buscarPorId(horario.getDisciplina().getId());
        ambienteService.buscarPorId(horario.getAmbiente().getId());

        // Valida se o professor atende ao curso dessa turma
        boolean professorPertenceAoCurso = prof.getCursos().stream()
                .anyMatch(c -> c.getId().equals(turma.getCurso().getId()));

        if (!prof.getCursos().isEmpty() && !professorPertenceAoCurso) {
            throw new BusinessException("O professor selecionado não leciona no curso da turma escolhida.");
        }
    }

    private void validarConflitos(Horario horario) {
        Long horarioId = horario.getId();

        if (horarioRepository.existeConflitoProfessor(
                horario.getDiaSemana(), horario.getHorarioInicio(), horario.getHorarioFim(), horario.getProfessor().getId(), horarioId)) {
            throw new BusinessException("O professor já tem uma aula vinculada neste mesmo dia e intervalo de horário.");
        }

        if (horarioRepository.existeConflitoAmbiente(
                horario.getDiaSemana(), horario.getHorarioInicio(), horario.getHorarioFim(), horario.getAmbiente().getId(), horarioId)) {
            throw new BusinessException("O ambiente selecionado já está ocupado neste dia e intervalo de horário.");
        }

        if (horarioRepository.existeConflitoTurma(
                horario.getDiaSemana(), horario.getHorarioInicio(), horario.getHorarioFim(), horario.getTurma().getId(), horarioId)) {
            throw new BusinessException("A turma já possui outra aula agendada neste mesmo dia e intervalo de horário.");
        }
    }

    @Transactional
    public Horario atualizar (Long id, Horario horarioAtualizado) {

        // Verifica se o horário existe antes de atualizar
        if (!horarioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Horário com ID " + id + " não encontrado.");
        }

        // Garante que o ID do objeto recebido é o mesmo do objeto que está sendo atualizadp
        horarioAtualizado.setId(id);

        // Faz as devidas validações
        validarHorarioInicioEFim(horarioAtualizado);
        validarEntidades(horarioAtualizado);
        validarConflitos(horarioAtualizado);

        return horarioRepository.save(horarioAtualizado);
    }
}