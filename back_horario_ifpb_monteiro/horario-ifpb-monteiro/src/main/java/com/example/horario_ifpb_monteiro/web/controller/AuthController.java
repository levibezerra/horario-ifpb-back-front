package com.example.horario_ifpb_monteiro.web.controller;

import com.example.horario_ifpb_monteiro.entity.Administrador;
import com.example.horario_ifpb_monteiro.service.AutenticacaoService;
import com.example.horario_ifpb_monteiro.web.dto.UpdateAdminProfileRequestDTO;
import com.example.horario_ifpb_monteiro.web.dto.AuthRequestDTO;
import com.example.horario_ifpb_monteiro.web.dto.AuthResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AutenticacaoService autenticacaoService;

    public AuthController(AutenticacaoService autenticacaoService) {
        this.autenticacaoService = autenticacaoService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody @Valid AuthRequestDTO dto) {
        return ResponseEntity.ok(autenticacaoService.login(dto));
    }

    @PostMapping({"/setup-admin", "/register"})
    public ResponseEntity<Administrador> cadastrarAdmin(@RequestBody @Valid Administrador admin) {
        return ResponseEntity.status(HttpStatus.CREATED).body(autenticacaoService.cadastrarAdmin(admin));
    }

    @PutMapping("/me")
    public ResponseEntity<UpdateAdminProfileRequestDTO> atualizarPerfil(
            Authentication authentication,
            @RequestBody @Valid UpdateAdminProfileRequestDTO dto
    ) {
        String emailLogado = authentication.getName();
        Administrador atualizado = autenticacaoService.atualizarPerfil(emailLogado, dto);

        return ResponseEntity.ok(new UpdateAdminProfileRequestDTO(
                atualizado.getId(),
                atualizado.getNome(),
                atualizado.getEmail()
        ));
    }
}