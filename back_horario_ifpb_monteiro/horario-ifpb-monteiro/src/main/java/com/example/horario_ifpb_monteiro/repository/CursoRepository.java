package com.example.horario_ifpb_monteiro.repository;

import com.example.horario_ifpb_monteiro.entity.Curso;
import com.example.horario_ifpb_monteiro.entity.Enum.ModalidadeCurso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CursoRepository extends JpaRepository<Curso, Long> {
    Optional<Curso> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);

    @Query("SELECT COUNT(c) > 0 FROM Curso c WHERE LOWER(TRIM(c.codigo)) = LOWER(TRIM(:codigo))")
    boolean existsByCodigoNormalizado(@Param("codigo") String codigo);

    @Query("SELECT COUNT(c) > 0 FROM Curso c WHERE c.id <> :id AND LOWER(TRIM(c.codigo)) = LOWER(TRIM(:codigo))")
    boolean existsByCodigoNormalizadoExcluindoId(@Param("id") Long id, @Param("codigo") String codigo);

    @Query("""
            SELECT COUNT(c) > 0 FROM Curso c
            WHERE LOWER(TRIM(c.nome)) = LOWER(TRIM(:nome))
              AND c.modalidade = :modalidade
            """)
    boolean existsDuplicado(@Param("nome") String nome, @Param("modalidade") ModalidadeCurso modalidade);

    @Query("""
            SELECT COUNT(c) > 0 FROM Curso c
            WHERE c.id <> :id
              AND LOWER(TRIM(c.nome)) = LOWER(TRIM(:nome))
              AND c.modalidade = :modalidade
            """)
    boolean existsDuplicadoExcluindoId(
            @Param("id") Long id,
            @Param("nome") String nome,
            @Param("modalidade") ModalidadeCurso modalidade
    );
}