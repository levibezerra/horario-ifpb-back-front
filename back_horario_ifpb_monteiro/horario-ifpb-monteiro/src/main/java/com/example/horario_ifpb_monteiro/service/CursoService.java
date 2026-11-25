package com.example.horario_ifpb_monteiro.service;

import com.example.horario_ifpb_monteiro.entity.Curso;
import com.example.horario_ifpb_monteiro.entity.Disciplina;
import com.example.horario_ifpb_monteiro.entity.Professor;
import com.example.horario_ifpb_monteiro.entity.Turma;
import com.example.horario_ifpb_monteiro.exceptions.BusinessException;
import com.example.horario_ifpb_monteiro.exceptions.ResourceNotFoundException;
import com.example.horario_ifpb_monteiro.repository.CursoRepository;
import com.example.horario_ifpb_monteiro.repository.DisciplinaRepository;
import com.example.horario_ifpb_monteiro.repository.ProfessorRepository;
import com.example.horario_ifpb_monteiro.repository.TurmaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

@Service
public class CursoService {

    private final CursoRepository repository;
    private final TurmaRepository turmaRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final ProfessorRepository professorRepository;

    public CursoService(
            CursoRepository repository,
            TurmaRepository turmaRepository,
            DisciplinaRepository disciplinaRepository,
            ProfessorRepository professorRepository
    ) {
        this.repository = repository;
        this.turmaRepository = turmaRepository;
        this.disciplinaRepository = disciplinaRepository;
        this.professorRepository = professorRepository;
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
        normalizarCampos(curso);
        validarUnicidade(null, curso);
        return repository.save(curso);
    }

    @Transactional
    public Curso atualizar(Long id, Curso cursoAtualizado) {
        Curso cursoExistente = buscarPorId(id);
        normalizarCampos(cursoAtualizado);
        validarUnicidade(id, cursoAtualizado);

        cursoExistente.setNome(cursoAtualizado.getNome());
        cursoExistente.setCodigo(cursoAtualizado.getCodigo());
        cursoExistente.setModalidade(cursoAtualizado.getModalidade());

        return repository.save(cursoExistente);
    }

    @Transactional
    public void deletar(Long id) {
        Curso curso = buscarPorId(id);

        List<Turma> turmas = turmaRepository.findByCursoId(id);
        List<Disciplina> disciplinas = disciplinaRepository.findByCursosId(id);
        List<Professor> professores = professorRepository.findByCursosId(id);

        if (!turmas.isEmpty() || !disciplinas.isEmpty() || !professores.isEmpty()) {
            List<String> detalhes = new ArrayList<>();

            if (!turmas.isEmpty()) {
                detalhes.add(formatarGrupoVinculo("turma(s)", turmas, turma -> formatarNomeTurmaComCodigo(turma, curso)));
            }
            if (!disciplinas.isEmpty()) {
                detalhes.add(formatarGrupoVinculo("disciplina(s)", disciplinas, Disciplina::getNome));
            }
            if (!professores.isEmpty()) {
                detalhes.add(formatarGrupoVinculo("professor(es)", professores, Professor::getNome));
            }

            throw new BusinessException(
                    "Não é possível excluir o curso \"" + curso.getNome() + "\" porque existem vínculos ativos: "
                            + String.join("; ", detalhes)
                            + ". Remova ou desvincule esses registros antes de excluir."
            );
        }

        repository.delete(curso);
    }

    private String formatarNomeTurmaComCodigo(Turma turma, Curso cursoFallback) {
        Curso cursoDaTurma = (turma.getCurso() != null) ? turma.getCurso() : cursoFallback;
        String codigo = (cursoDaTurma != null && cursoDaTurma.getCodigo() != null)
                ? cursoDaTurma.getCodigo().trim()
                : "";

        return codigo.isEmpty()
                ? turma.getNome()
                : turma.getNome() + " (" + codigo + ")";
    }

    private <T> String formatarGrupoVinculo(String rotulo, List<T> itens, Function<T, String> extratorNome) {
        int limite = 3;
        List<String> nomes = itens.stream()
                .limit(limite)
                .map(extratorNome)
                .toList();

        String listaFormatada = String.join(", ", nomes);
        if (itens.size() > limite) {
            listaFormatada += " e mais " + (itens.size() - limite);
        }

        return itens.size() + " " + rotulo + " (" + listaFormatada + ")";
    }

    private void normalizarCampos(Curso curso) {
        if (curso.getNome() != null) {
            curso.setNome(curso.getNome().trim());
        }
        if (curso.getCodigo() != null) {
            curso.setCodigo(curso.getCodigo().trim().toUpperCase());
        }
    }

    private void validarUnicidade(Long idAtual, Curso curso) {
        boolean codigoDuplicado = (idAtual == null)
                ? repository.existsByCodigoNormalizado(curso.getCodigo())
                : repository.existsByCodigoNormalizadoExcluindoId(idAtual, curso.getCodigo());

        if (codigoDuplicado) {
            throw new BusinessException(
                    "Já existe um curso cadastrado com o código \"" + curso.getCodigo() + "\"."
            );
        }

        boolean nomeDuplicado = (idAtual == null)
                ? repository.existsDuplicado(curso.getNome(), curso.getModalidade())
                : repository.existsDuplicadoExcluindoId(idAtual, curso.getNome(), curso.getModalidade());

        if (nomeDuplicado) {
            throw new BusinessException(
                    "Já existe um curso cadastrado com o nome \"" + curso.getNome() + "\" nesta modalidade."
            );
        }
    }
}