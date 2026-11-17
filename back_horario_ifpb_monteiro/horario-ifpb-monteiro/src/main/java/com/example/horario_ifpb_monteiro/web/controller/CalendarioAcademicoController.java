package com.example.horario_ifpb_monteiro.web.controller;

import com.example.horario_ifpb_monteiro.entity.CalendarioAcademico;
import com.example.horario_ifpb_monteiro.entity.Enum.StatusCalendarioAcademico;
import com.example.horario_ifpb_monteiro.entity.Enum.TipoCalendarioAcademico;
import com.example.horario_ifpb_monteiro.service.CalendarioAcademicoService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/calendarios-academicos")
public class CalendarioAcademicoController {

    private final CalendarioAcademicoService service;

    public CalendarioAcademicoController(CalendarioAcademicoService service) {
        this.service = service;
    }

    @GetMapping
    public List<CalendarioAcademico> listarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/publicos")
    public List<CalendarioAcademico> listarPublicados() {
        return service.listarPublicados();
    }

    @GetMapping("/publico/{tipo}")
    public ResponseEntity<CalendarioAcademico> buscarPublicadoPorTipo(@PathVariable TipoCalendarioAcademico tipo) {
        return service.buscarPublicadoPorTipo(tipo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CalendarioAcademico> criar(
            @RequestParam("titulo") String titulo,
            @RequestParam(value = "tipo", defaultValue = "SUPERIOR") TipoCalendarioAcademico tipo,
            @RequestParam(value = "status", required = false) StatusCalendarioAcademico status,
            @RequestParam(value = "publicado", defaultValue = "false") boolean publicado,
            @RequestParam("arquivo") MultipartFile arquivo
    ) throws IOException {
        StatusCalendarioAcademico statusResolvido = resolverStatus(status, publicado);
        return ResponseEntity.ok(service.criar(titulo, tipo, statusResolvido, arquivo));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CalendarioAcademico> atualizar(
            @PathVariable Long id,
            @RequestParam("titulo") String titulo,
            @RequestParam(value = "tipo", required = false) TipoCalendarioAcademico tipo,
            @RequestParam(value = "status", required = false) StatusCalendarioAcademico status,
            @RequestParam(value = "publicado", defaultValue = "false") boolean publicado,
            @RequestParam(value = "arquivo", required = false) MultipartFile arquivo
    ) throws IOException {
        StatusCalendarioAcademico statusResolvido = resolverStatus(status, publicado);
        return ResponseEntity.ok(service.atualizar(id, titulo, tipo, statusResolvido, arquivo));
    }

    @PatchMapping("/{id}/publicar")
    public ResponseEntity<CalendarioAcademico> publicar(@PathVariable Long id) {
        return ResponseEntity.ok(service.publicar(id));
    }

    @PatchMapping("/{id}/despublicar")
    public ResponseEntity<CalendarioAcademico> despublicar(@PathVariable Long id) {
        return ResponseEntity.ok(service.despublicar(id));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) throws IOException {
        CalendarioAcademico entity = service.buscarPorId(id);
        Resource resource = service.carregarArquivo(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + entity.getNomeArquivo() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) throws IOException {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }

    private StatusCalendarioAcademico resolverStatus(StatusCalendarioAcademico status, boolean publicado) {
        if (status != null) {
            return status;
        }
        return publicado ? StatusCalendarioAcademico.PUBLICADO : StatusCalendarioAcademico.RASCUNHO;
    }
}