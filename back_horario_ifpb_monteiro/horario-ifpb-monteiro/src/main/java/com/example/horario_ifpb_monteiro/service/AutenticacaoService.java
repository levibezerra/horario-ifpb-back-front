package com.example.horario_ifpb_monteiro.service;

import com.example.horario_ifpb_monteiro.entity.Administrador;
import com.example.horario_ifpb_monteiro.exceptions.BusinessException;
import com.example.horario_ifpb_monteiro.jwt.JwtTokenProvider;
import com.example.horario_ifpb_monteiro.repository.AdministradorRepository;
import com.example.horario_ifpb_monteiro.web.dto.AuthRequestDTO;
import com.example.horario_ifpb_monteiro.web.dto.AuthResponseDTO;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AutenticacaoService {

    private final AdministradorRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AutenticacaoService(AdministradorRepository adminRepository,
                               PasswordEncoder passwordEncoder,
                               JwtTokenProvider tokenProvider) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public AuthResponseDTO login(AuthRequestDTO dto) {
        Administrador admin = adminRepository.findByEmail(dto.email())
                .orElseThrow(() -> new BusinessException("Credenciais inválidas."));

        if (!passwordEncoder.matches(dto.senha(), admin.getSenha())) {
            throw new BusinessException("Credenciais inválidas.");
        }

        String token = tokenProvider.generateToken(admin.getEmail());
        return new AuthResponseDTO(token, admin.getNome(), admin.getEmail());
    }

    public Administrador cadastrarAdmin(Administrador admin) {
        if (adminRepository.findByEmail(admin.getEmail()).isPresent()) {
            throw new BusinessException("Já existe um administrador cadastrado com este e-mail.");
        }

        admin.setSenha(passwordEncoder.encode(admin.getSenha()));
        return adminRepository.save(admin);
    }
}