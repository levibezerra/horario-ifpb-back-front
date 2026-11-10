package com.example.horario_ifpb_monteiro.repository;

import com.example.horario_ifpb_monteiro.entity.Ambiente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AmbienteRepository extends JpaRepository<Ambiente, Long> {
    List<Ambiente> findByCategoria(String categoria);
    List<Ambiente> findByLocalizacao(String localizacao);
}