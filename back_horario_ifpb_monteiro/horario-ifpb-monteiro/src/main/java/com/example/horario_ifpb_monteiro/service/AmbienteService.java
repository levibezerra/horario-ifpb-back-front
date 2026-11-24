package com.example.horario_ifpb_monteiro.service;

import com.example.horario_ifpb_monteiro.entity.Ambiente;
import com.example.horario_ifpb_monteiro.entity.Enum.CategoriaAmbiente;
import com.example.horario_ifpb_monteiro.exceptions.BusinessException;
import com.example.horario_ifpb_monteiro.exceptions.ResourceNotFoundException;
import com.example.horario_ifpb_monteiro.repository.AmbienteRepository;
import com.example.horario_ifpb_monteiro.repository.HorarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AmbienteService {

    private final AmbienteRepository repository;
    private final HorarioRepository horarioRepository;

    public AmbienteService(
            AmbienteRepository repository,
            HorarioRepository horarioRepository
    ) {
        this.repository = repository;
        this.horarioRepository = horarioRepository;
    }

    @Transactional(readOnly = true)
    public List<Ambiente> listarTodos() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Ambiente buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ambiente não encontrado com o ID: " + id));
    }

    @Transactional
    public Ambiente salvar(Ambiente ambiente) {
        normalizarCampos(ambiente);
        validarUnicidade(null, ambiente);
        return repository.save(ambiente);
    }

    @Transactional
    public Ambiente atualizar(Long id, Ambiente ambienteAtualizado) {
        Ambiente ambienteExistente = buscarPorId(id);
        normalizarCampos(ambienteAtualizado);
        validarUnicidade(id, ambienteAtualizado);

        ambienteExistente.setNome(ambienteAtualizado.getNome());
        ambienteExistente.setCategoria(ambienteAtualizado.getCategoria());
        ambienteExistente.setLocalizacao(ambienteAtualizado.getLocalizacao());

        return repository.save(ambienteExistente);
    }

    @Transactional
    public void deletar(Long id) {
        Ambiente ambiente = buscarPorId(id);

        long totalHorarios = horarioRepository.countByAmbienteId(id);
        if (totalHorarios > 0) {
            throw new BusinessException(
                    "Não é possível excluir o ambiente \"" + ambiente.getNome() + "\" porque existem "
                            + totalHorarios + " horário(s) vinculados a ele. Remova ou altere os horários antes de excluir."
            );
        }

        repository.delete(ambiente);
    }

    private void normalizarCampos(Ambiente ambiente) {
        if (ambiente.getNome() != null) {
            ambiente.setNome(ambiente.getNome().trim());
        }
        if (ambiente.getLocalizacao() != null) {
            String loc = ambiente.getLocalizacao().trim();
            ambiente.setLocalizacao(loc.isEmpty() ? null : loc);
        }
    }

    private void validarUnicidade(Long idAtual, Ambiente ambiente) {
        boolean duplicado = (idAtual == null)
                ? repository.existsDuplicado(ambiente.getNome(), ambiente.getCategoria(), ambiente.getLocalizacao())
                : repository.existsDuplicadoExcluindoId(idAtual, ambiente.getNome(), ambiente.getCategoria(), ambiente.getLocalizacao());

        if (duplicado) {
            String localInfo = (ambiente.getLocalizacao() != null)
                    ? "no bloco/localização \"" + ambiente.getLocalizacao() + "\""
                    : "sem bloco/localização informada";

            throw new BusinessException(
                    "Já existe um ambiente cadastrado com o nome \"" + ambiente.getNome()
                            + "\" do tipo \"" + formatarCategoria(ambiente.getCategoria()) + "\" "
                            + localInfo + "."
            );
        }
    }

    private String formatarCategoria(CategoriaAmbiente categoria) {
        if (categoria == null) return "";
        String texto = categoria.name().replace('_', ' ').toLowerCase();
        return Character.toUpperCase(texto.charAt(0)) + texto.substring(1);
    }
}