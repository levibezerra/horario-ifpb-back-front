package com.example.horario_ifpb_monteiro.service;

import com.example.horario_ifpb_monteiro.entity.*;
import com.example.horario_ifpb_monteiro.entity.Enum.StatusHorario;
import com.example.horario_ifpb_monteiro.exceptions.BusinessException;
import com.example.horario_ifpb_monteiro.exceptions.ResourceNotFoundException;
import com.example.horario_ifpb_monteiro.repository.HorarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
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
        validarHorarioDePausa(horario);
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
            List<Horario> rascunhos = horarioRepository.findByStatus(StatusHorario.RASCUNHO);
            rascunhos.forEach(h -> h.setStatus(StatusHorario.PUBLICADO));
            horarioRepository.saveAll(rascunhos);
        } else {
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

    private void validarHorarioDePausa(Horario horario) {
        LocalTime inicio = horario.getHorarioInicio();
        LocalTime fim = horario.getHorarioFim();

        // Intervalos de pausa
        LocalTime lancheManhaInicio = LocalTime.of(8, 40);
        LocalTime lancheManhaFim = LocalTime.of(9, 0);

        LocalTime lancheTardeInicio = LocalTime.of(15, 30);
        LocalTime lancheTardeFim = LocalTime.of(15, 40);

        LocalTime almocoInicio = LocalTime.of(12, 20);
        LocalTime almocoFim = LocalTime.of(13, 0);

        LocalTime jantaInicio = LocalTime.of(20, 10);
        LocalTime jantaFim = LocalTime.of(20, 30);

        if (colideComPausa(inicio, fim, lancheManhaInicio, lancheManhaFim)) {
            throw new BusinessException("Não é permitido cadastrar aulas no horário de lanche da manhã (08:40 - 09:00).");
        }

        if (colideComPausa(inicio, fim, lancheTardeInicio, lancheTardeFim)) {
            throw new BusinessException("Não é permitido cadastrar aulas no horário de lanche da tarde (15:30 - 15:40).");
        }

        if (colideComPausa(inicio, fim, almocoInicio, almocoFim)) {
            throw new BusinessException("Não é permitido cadastrar aulas no horário de almoço (12:20 - 13:00).");
        }

        if (colideComPausa(inicio, fim, jantaInicio, jantaFim)) {
            throw new BusinessException("Não é permitido cadastrar aulas no horário de janta (20:10 - 20:30).");
        }
    }

    private boolean colideComPausa(LocalTime aulaInicio, LocalTime aulaFim, LocalTime pausaInicio, LocalTime pausaFim) {
        return aulaInicio.isBefore(pausaFim) && aulaFim.isAfter(pausaInicio);
    }

    private void validarEntidades(Horario horario) {
        Professor prof = professorService.buscarPorId(horario.getProfessor().getId());
        Turma turma = turmaService.buscarPorId(horario.getTurma().getId());
        disciplinaService.buscarPorId(horario.getDisciplina().getId());
        ambienteService.buscarPorId(horario.getAmbiente().getId());

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
        if (!horarioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Horário com ID " + id + " não encontrado.");
        }

        horarioAtualizado.setId(id);

        validarHorarioInicioEFim(horarioAtualizado);
        validarHorarioDePausa(horarioAtualizado);
        validarEntidades(horarioAtualizado);
        validarConflitos(horarioAtualizado);

        return horarioRepository.save(horarioAtualizado);
    }
}