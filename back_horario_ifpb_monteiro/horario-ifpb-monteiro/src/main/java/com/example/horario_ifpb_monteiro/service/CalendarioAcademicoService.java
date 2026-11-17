package com.example.horario_ifpb_monteiro.service;

import com.example.horario_ifpb_monteiro.entity.CalendarioAcademico;
import com.example.horario_ifpb_monteiro.entity.Enum.StatusCalendarioAcademico;
import com.example.horario_ifpb_monteiro.entity.Enum.TipoCalendarioAcademico;
import com.example.horario_ifpb_monteiro.repository.CalendarioAcademicoRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CalendarioAcademicoService {

    private final CalendarioAcademicoRepository repository;
    private final Path uploadDir = Paths.get("uploads/calendarios-academicos");

    public CalendarioAcademicoService(CalendarioAcademicoRepository repository) throws IOException {
        this.repository = repository;
        Files.createDirectories(uploadDir);
    }

    public List<CalendarioAcademico> listarTodos() {
        return repository.findAllByOrderByCriadoEmDesc();
    }

    public List<CalendarioAcademico> listarPublicados() {
        return repository.findAllByStatusOrderByCriadoEmDesc(StatusCalendarioAcademico.PUBLICADO);
    }

    public Optional<CalendarioAcademico> buscarPublicadoPorTipo(TipoCalendarioAcademico tipo) {
        return repository.findFirstByTipoAndStatusOrderByCriadoEmDesc(tipo, StatusCalendarioAcademico.PUBLICADO);
    }

    public CalendarioAcademico buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Calendário acadêmico não encontrado."));
    }

    @Transactional
    public CalendarioAcademico criar(
            String titulo,
            TipoCalendarioAcademico tipo,
            StatusCalendarioAcademico status,
            MultipartFile arquivo
    ) throws IOException {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new IllegalArgumentException("O arquivo PDF do calendário acadêmico é obrigatório.");
        }

        validarPdf(arquivo);

        TipoCalendarioAcademico tipoResolvido = tipo != null ? tipo : TipoCalendarioAcademico.SUPERIOR;
        StatusCalendarioAcademico statusResolvido = status != null ? status : StatusCalendarioAcademico.RASCUNHO;

        if (statusResolvido == StatusCalendarioAcademico.PUBLICADO) {
            despublicarPorTipo(tipoResolvido);
        }

        String nomeOriginal = arquivo.getOriginalFilename() != null
                ? arquivo.getOriginalFilename()
                : "calendario-academico.pdf";
        Path destino = salvarArquivoNoDisco(arquivo, nomeOriginal);

        CalendarioAcademico entity = new CalendarioAcademico();
        entity.setTitulo(titulo.trim());
        entity.setTipo(tipoResolvido);
        entity.setNomeArquivo(nomeOriginal);
        entity.setCaminhoArquivo(destino.toString());
        entity.setStatus(statusResolvido);

        return repository.save(entity);
    }

    @Transactional
    public CalendarioAcademico atualizar(
            Long id,
            String titulo,
            TipoCalendarioAcademico tipo,
            StatusCalendarioAcademico status,
            MultipartFile arquivo
    ) throws IOException {
        CalendarioAcademico entity = buscarPorId(id);

        TipoCalendarioAcademico tipoResolvido = tipo != null ? tipo : entity.getTipo();
        StatusCalendarioAcademico statusResolvido = status != null ? status : entity.getStatus();

        if (statusResolvido == StatusCalendarioAcademico.PUBLICADO) {
            despublicarPorTipo(tipoResolvido);
        }

        entity.setTitulo(titulo.trim());
        entity.setTipo(tipoResolvido);
        entity.setStatus(statusResolvido);

        if (arquivo != null && !arquivo.isEmpty()) {
            validarPdf(arquivo);
            Files.deleteIfExists(Paths.get(entity.getCaminhoArquivo()));

            String nomeOriginal = arquivo.getOriginalFilename() != null
                    ? arquivo.getOriginalFilename()
                    : "calendario-academico.pdf";
            Path destino = salvarArquivoNoDisco(arquivo, nomeOriginal);

            entity.setNomeArquivo(nomeOriginal);
            entity.setCaminhoArquivo(destino.toString());
        }

        return repository.save(entity);
    }

    @Transactional
    public CalendarioAcademico publicar(Long id) {
        CalendarioAcademico entity = buscarPorId(id);
        despublicarPorTipo(entity.getTipo());
        entity.setStatus(StatusCalendarioAcademico.PUBLICADO);
        return repository.save(entity);
    }

    @Transactional
    public CalendarioAcademico despublicar(Long id) {
        CalendarioAcademico entity = buscarPorId(id);
        entity.setStatus(StatusCalendarioAcademico.RASCUNHO);
        return repository.save(entity);
    }

    public Resource carregarArquivo(Long id) throws IOException {
        CalendarioAcademico entity = buscarPorId(id);
        Path path = Paths.get(entity.getCaminhoArquivo());
        Resource resource = new UrlResource(path.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            throw new IllegalArgumentException("Arquivo PDF não encontrado no servidor.");
        }

        return resource;
    }

    @Transactional
    public void excluir(Long id) throws IOException {
        CalendarioAcademico entity = buscarPorId(id);
        Files.deleteIfExists(Paths.get(entity.getCaminhoArquivo()));
        repository.delete(entity);
    }

    private void despublicarPorTipo(TipoCalendarioAcademico tipo) {
        List<CalendarioAcademico> doMesmoTipo = repository.findAllByTipo(tipo);
        doMesmoTipo.forEach(c -> c.setStatus(StatusCalendarioAcademico.RASCUNHO));
        repository.saveAll(doMesmoTipo);
    }

    private Path salvarArquivoNoDisco(MultipartFile arquivo, String nomeOriginal) throws IOException {
        String nomeSalvo = UUID.randomUUID() + "_" + nomeOriginal;
        Path destino = uploadDir.resolve(nomeSalvo);
        Files.copy(arquivo.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);
        return destino;
    }

    private void validarPdf(MultipartFile arquivo) {
        String contentType = arquivo.getContentType();
        String nome = arquivo.getOriginalFilename() != null ? arquivo.getOriginalFilename().toLowerCase() : "";
        boolean isPdf = "application/pdf".equalsIgnoreCase(contentType) || nome.endsWith(".pdf");

        if (!isPdf) {
            throw new IllegalArgumentException("Apenas arquivos no formato PDF (.pdf) são permitidos.");
        }
    }
}