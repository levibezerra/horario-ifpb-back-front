package com.example.horario_ifpb_monteiro.repository;

import com.example.horario_ifpb_monteiro.entity.AnoLetivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnoLetivoRepository extends JpaRepository<AnoLetivo, Long> {

}
