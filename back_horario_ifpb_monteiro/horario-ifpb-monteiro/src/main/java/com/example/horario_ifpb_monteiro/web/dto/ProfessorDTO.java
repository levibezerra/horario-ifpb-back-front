package com.example.horario_ifpb_monteiro.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;

import java.util.Set;

public record ProfessorDTO(
        Long id,

        @NotBlank(message = "O nome do professor é obrigatório")
        String nome,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "E-mail inválido")
        String email,

        @URL(message = "URL do currículo Lattes inválida")
        String lattesUrl,

        Set<Long> cursosIds,

        Set<String> cursosNomes
) {}