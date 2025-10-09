package com.club.management.service;

import com.club.management.dto.request.CategoriaTransaccionRequest;
import com.club.management.dto.response.CategoriaTransaccionDTO;
import com.club.management.entity.CategoriaTransaccion;
import com.club.management.entity.CategoriaTransaccion.TipoTransaccion;
import com.club.management.repository.CategoriaTransaccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoriaTransaccionService {

    private final CategoriaTransaccionRepository categoriaTransaccionRepository;

    @Transactional(readOnly = true)
    public List<CategoriaTransaccionDTO> findAll() {
        return categoriaTransaccionRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoriaTransaccionDTO> findActivas() {
        return categoriaTransaccionRepository.findByActivaTrue().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoriaTransaccionDTO> findByTipo(String tipo) {
        TipoTransaccion tipoEnum = TipoTransaccion.valueOf(tipo);
        return categoriaTransaccionRepository.findByTipo(tipoEnum).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoriaTransaccionDTO> findByTipoActivas(String tipo) {
        TipoTransaccion tipoEnum = TipoTransaccion.valueOf(tipo);
        return categoriaTransaccionRepository.findByTipoAndActivaTrue(tipoEnum).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoriaTransaccionDTO findById(Long id) {
        CategoriaTransaccion categoria = categoriaTransaccionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
        return mapToDTO(categoria);
    }

    @Transactional
    public CategoriaTransaccionDTO create(CategoriaTransaccionRequest request) {
        CategoriaTransaccion categoria = new CategoriaTransaccion();
        categoria.setNombre(request.getNombre());
        categoria.setTipo(request.getTipo());
        categoria.setDescripcion(request.getDescripcion());
        categoria.setActiva(request.getActiva() != null ? request.getActiva() : true);

        categoria = categoriaTransaccionRepository.save(categoria);
        return mapToDTO(categoria);
    }

    @Transactional
    public CategoriaTransaccionDTO update(Long id, CategoriaTransaccionRequest request) {
        CategoriaTransaccion categoria = categoriaTransaccionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        categoria.setNombre(request.getNombre());
        categoria.setTipo(request.getTipo());
        categoria.setDescripcion(request.getDescripcion());
        if (request.getActiva() != null) {
            categoria.setActiva(request.getActiva());
        }

        categoria = categoriaTransaccionRepository.save(categoria);
        return mapToDTO(categoria);
    }

    @Transactional
    public void delete(Long id) {
        categoriaTransaccionRepository.deleteById(id);
    }

    private CategoriaTransaccionDTO mapToDTO(CategoriaTransaccion categoria) {
        CategoriaTransaccionDTO dto = new CategoriaTransaccionDTO();
        dto.setId(categoria.getId());
        dto.setNombre(categoria.getNombre());
        dto.setTipo(categoria.getTipo().name());
        dto.setDescripcion(categoria.getDescripcion());
        dto.setActiva(categoria.getActiva());
        dto.setCreadoEn(categoria.getCreadoEn());
        dto.setActualizadoEn(categoria.getActualizadoEn());
        return dto;
    }
}
