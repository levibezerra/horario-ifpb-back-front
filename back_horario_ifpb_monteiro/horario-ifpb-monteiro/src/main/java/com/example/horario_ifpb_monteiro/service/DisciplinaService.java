package com.example.horario_ifpb_monteiro.service;

import com.example.horario_ifpb_monteiro.entity.Curso;
import com.example.horario_ifpb_monteiro.entity.Disciplina;
import com.example.horario_ifpb_monteiro.entity.Turma;
import com.example.horario_ifpb_monteiro.exceptions.ResourceNotFoundException;
import com.example.horario_ifpb_monteiro.repository.CursoRepository;
import com.example.horario_ifpb_monteiro.repository.DisciplinaRepository;
import com.example.horario_ifpb_monteiro.repository.TurmaRepository;
import com.example.horario_ifpb_monteiro.web.dto.DisciplinaRequestDTO;
import com.example.horario_ifpb_monteiro.web.dto.DisciplinaResponseDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class DisciplinaService {

    private final DisciplinaRepository repository;
    private final CursoRepository cursoRepository;
    private final TurmaRepository turmaRepository;

    public DisciplinaService(
            DisciplinaRepository repository,
            CursoRepository cursoRepository,
            TurmaRepository turmaRepository
    ) {
        this.repository = repository;
        this.cursoRepository = cursoRepository;
        this.turmaRepository = turmaRepository;
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
        Set<Curso> cursos = carregarCursos(dto);
        Curso cursoPrincipal = definirCursoPrincipal(dto, cursos);
        Set<Turma> turmas = carregarTurmas(dto.turmaIds(), cursos);

        Disciplina disciplina = Disciplina.builder()
                .nome(dto.nome().trim())
                .curso(cursoPrincipal)
                .cursos(cursos)
                .turmas(turmas)
                .build();

        Disciplina salva = repository.saveAndFlush(disciplina);
        return DisciplinaResponseDTO.fromEntity(salva);
    }

    @Transactional
    public DisciplinaResponseDTO atualizar(Long id, DisciplinaRequestDTO dto) {
        Disciplina disciplinaExistente = buscarPorId(id);

        Set<Curso> cursos = carregarCursos(dto);
        Curso cursoPrincipal = definirCursoPrincipal(dto, cursos);
        Set<Turma> turmas = carregarTurmas(dto.turmaIds(), cursos);

        disciplinaExistente.setNome(dto.nome().trim());
        disciplinaExistente.setCurso(cursoPrincipal);

        disciplinaExistente.getCursos().clear();
        disciplinaExistente.getCursos().addAll(cursos);

        disciplinaExistente.getTurmas().clear();
        disciplinaExistente.getTurmas().addAll(turmas);

        Disciplina atualizada = repository.saveAndFlush(disciplinaExistente);
        return DisciplinaResponseDTO.fromEntity(atualizada);
    }

    @Transactional
    public void deletar(Long id) {
        buscarPorId(id);
        repository.deleteById(id);
    }

    private Set<Curso> carregarCursos(DisciplinaRequestDTO dto) {
        List<Long> ids = dto.resolverCursoIds();
        if (ids.isEmpty()) {
            throw new IllegalArgumentException("Informe ao menos um curso vinculado.");
        }

        List<Curso> encontrados = cursoRepository.findAllById(ids);
        if (encontrados.size() != new HashSet<>(ids).size()) {
            throw new ResourceNotFoundException("Um ou mais cursos informados não foram encontrados.");
        }
        return new HashSet<>(encontrados);
    }

    private Curso definirCursoPrincipal(DisciplinaRequestDTO dto, Set<Curso> cursos) {
        if (dto.cursoId() != null) {
            return cursos.stream()
                    .filter(c -> c.getId().equals(dto.cursoId()))
                    .findFirst()
                    .orElseGet(() -> cursos.iterator().next());
        }
        return cursos.iterator().next();
    }

    private Set<Turma> carregarTurmas(List<Long> turmaIds, Set<Curso> cursos) {
        List<Turma> encontradas = turmaRepository.findAllById(turmaIds);
        if (encontradas.size() != new HashSet<>(turmaIds).size()) {
            throw new ResourceNotFoundException("Uma ou mais turmas informadas não foram encontradas.");
        }

        Set<Long> cursoIdsPermitidos = new HashSet<>();
        cursos.forEach(c -> cursoIdsPermitidos.add(c.getId()));

        boolean algumaTurmaForaDosCursos = encontradas.stream()
                .anyMatch(t -> t.getCurso() == null || !cursoIdsPermitidos.contains(t.getCurso().getId()));

        if (algumaTurmaForaDosCursos) {
            throw new IllegalArgumentException("Todas as turmas vinculadas devem pertencer aos cursos selecionados.");
        }

        return new HashSet<>(encontradas);
    }
}