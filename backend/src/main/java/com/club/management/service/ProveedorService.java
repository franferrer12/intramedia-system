package com.club.management.service;

import com.club.management.dto.request.ProveedorRequest;
import com.club.management.dto.response.ProveedorDTO;
import com.club.management.entity.Proveedor;
import com.club.management.entity.Proveedor.TipoProveedor;
import com.club.management.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para gestión de Proveedores
 */
@Service
@RequiredArgsConstructor
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;

    /**
     * Obtener todos los proveedores
     */
    @Transactional(readOnly = true)
    public List<ProveedorDTO> getAllProveedores() {
        return proveedorRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener proveedor por ID
     */
    @Transactional(readOnly = true)
    public ProveedorDTO getProveedorById(Long id) {
        Proveedor proveedor = proveedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado con id: " + id));
        return mapToDTO(proveedor);
    }

    /**
     * Obtener proveedores activos
     */
    @Transactional(readOnly = true)
    public List<ProveedorDTO> getProveedoresActivos() {
        return proveedorRepository.findByActivoTrue().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener proveedores por tipo
     */
    @Transactional(readOnly = true)
    public List<ProveedorDTO> getProveedoresByTipo(TipoProveedor tipo) {
        return proveedorRepository.findByTipo(tipo).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Crear nuevo proveedor
     */
    @Transactional
    public ProveedorDTO createProveedor(ProveedorRequest request) {
        Proveedor proveedor = Proveedor.builder()
                .nombre(request.getNombre())
                .contacto(request.getContacto())
                .telefono(request.getTelefono())
                .email(request.getEmail())
                .direccion(request.getDireccion())
                .tipo(request.getTipo())
                .activo(request.getActivo() != null ? request.getActivo() : true)
                .build();

        Proveedor savedProveedor = proveedorRepository.save(proveedor);
        return mapToDTO(savedProveedor);
    }

    /**
     * Actualizar proveedor existente
     */
    @Transactional
    public ProveedorDTO updateProveedor(Long id, ProveedorRequest request) {
        Proveedor proveedor = proveedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado con id: " + id));

        proveedor.setNombre(request.getNombre());
        proveedor.setContacto(request.getContacto());
        proveedor.setTelefono(request.getTelefono());
        proveedor.setEmail(request.getEmail());
        proveedor.setDireccion(request.getDireccion());
        proveedor.setTipo(request.getTipo());
        proveedor.setActivo(request.getActivo());

        Proveedor updatedProveedor = proveedorRepository.save(proveedor);
        return mapToDTO(updatedProveedor);
    }

    /**
     * Eliminar proveedor
     */
    @Transactional
    public void deleteProveedor(Long id) {
        if (!proveedorRepository.existsById(id)) {
            throw new RuntimeException("Proveedor no encontrado con id: " + id);
        }
        proveedorRepository.deleteById(id);
    }

    /**
     * Mapear Proveedor a ProveedorDTO
     */
    private ProveedorDTO mapToDTO(Proveedor proveedor) {
        return ProveedorDTO.builder()
                .id(proveedor.getId())
                .nombre(proveedor.getNombre())
                .contacto(proveedor.getContacto())
                .telefono(proveedor.getTelefono())
                .email(proveedor.getEmail())
                .direccion(proveedor.getDireccion())
                .tipo(proveedor.getTipo().name())
                .activo(proveedor.getActivo())
                .creadoEn(proveedor.getCreadoEn())
                .actualizadoEn(proveedor.getActualizadoEn())
                .build();
    }
}
