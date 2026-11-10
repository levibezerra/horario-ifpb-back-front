package com.example.horario_ifpb_monteiro.service;

import com.example.horario_ifpb_monteiro.entity.Ambiente;
import com.example.horario_ifpb_monteiro.exceptions.ResourceNotFoundException;
import com.example.horario_ifpb_monteiro.repository.AmbienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AmbienteService {

    private final AmbienteRepository repository;

    public AmbienteService(AmbienteRepository repository) {
        this.repository = repository;
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
        return repository.save(ambiente);
    }

    @Transactional
    public Ambiente atualizar(Long id, Ambiente ambienteAtualizado) {
        Ambiente ambienteExistente = buscarPorId(id);

        ambienteExistente.setNome(ambienteAtualizado.getNome());
        ambienteExistente.setCategoria(ambienteAtualizado.getCategoria());
        ambienteExistente.setLocalizacao(ambienteAtualizado.getLocalizacao());

        return repository.save(ambienteExistente);
    }

    @Transactional
    public void deletar(Long id) {
        buscarPorId(id);
        repository.deleteById(id);
    }
}