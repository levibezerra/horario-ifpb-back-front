package com.example.horario_ifpb_monteiro.repository;

import com.example.horario_ifpb_monteiro.entity.Ambiente;
import com.example.horario_ifpb_monteiro.entity.Enum.CategoriaAmbiente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AmbienteRepository extends JpaRepository<Ambiente, Long> {
    List<Ambiente> findByCategoria(CategoriaAmbiente categoria);
    List<Ambiente> findByLocalizacao(String localizacao);

    @Query("""
            SELECT COUNT(a) > 0 FROM Ambiente a
            WHERE LOWER(TRIM(a.nome)) = LOWER(TRIM(:nome))
              AND a.categoria = :categoria
              AND COALESCE(LOWER(TRIM(a.localizacao)), '') = COALESCE(LOWER(TRIM(:localizacao)), '')
            """)
    boolean existsDuplicado(
            @Param("nome") String nome,
            @Param("categoria") CategoriaAmbiente categoria,
            @Param("localizacao") String localizacao
    );

    @Query("""
            SELECT COUNT(a) > 0 FROM Ambiente a
            WHERE a.id <> :id
              AND LOWER(TRIM(a.nome)) = LOWER(TRIM(:nome))
              AND a.categoria = :categoria
              AND COALESCE(LOWER(TRIM(a.localizacao)), '') = COALESCE(LOWER(TRIM(:localizacao)), '')
            """)
    boolean existsDuplicadoExcluindoId(
            @Param("id") Long id,
            @Param("nome") String nome,
            @Param("categoria") CategoriaAmbiente categoria,
            @Param("localizacao") String localizacao
    );
}