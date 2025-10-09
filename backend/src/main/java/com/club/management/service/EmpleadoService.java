package com.club.management.service;

import com.club.management.dto.request.EmpleadoRequest;
import com.club.management.dto.response.EmpleadoDTO;
import com.club.management.entity.Empleado;
import com.club.management.repository.EmpleadoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmpleadoService {

    private final EmpleadoRepository empleadoRepository;

    @Transactional(readOnly = true)
    public List<EmpleadoDTO> findAll() {
        return empleadoRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmpleadoDTO> findActivos() {
        return empleadoRepository.findByActivoTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmpleadoDTO> findInactivos() {
        return empleadoRepository.findByActivoFalse().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmpleadoDTO findById(Long id) {
        Empleado empleado = empleadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con id: " + id));
        return toDTO(empleado);
    }

    @Transactional(readOnly = true)
    public List<EmpleadoDTO> findByCargo(String cargo) {
        return empleadoRepository.findByCargo(cargo).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmpleadoDTO> findByDepartamento(String departamento) {
        return empleadoRepository.findByDepartamento(departamento).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmpleadoDTO> search(String searchTerm) {
        return empleadoRepository.searchEmpleados(searchTerm).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getAllCargos() {
        return empleadoRepository.findAllCargos();
    }

    @Transactional(readOnly = true)
    public List<String> getAllDepartamentos() {
        return empleadoRepository.findAllDepartamentos();
    }

    @Transactional(readOnly = true)
    public Long countActivos() {
        return empleadoRepository.countActivos();
    }

    @Transactional
    public EmpleadoDTO create(EmpleadoRequest request) {
        // Verificar que no exista otro empleado con el mismo DNI
        if (empleadoRepository.findByDni(request.getDni()).isPresent()) {
            throw new RuntimeException("Ya existe un empleado con el DNI: " + request.getDni());
        }

        Empleado empleado = new Empleado();
        mapToEntity(request, empleado);

        Empleado saved = empleadoRepository.save(empleado);
        return toDTO(saved);
    }

    @Transactional
    public EmpleadoDTO update(Long id, EmpleadoRequest request) {
        Empleado empleado = empleadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con id: " + id));

        // Verificar que el DNI no esté siendo usado por otro empleado
        empleadoRepository.findByDni(request.getDni()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new RuntimeException("Ya existe un empleado con el DNI: " + request.getDni());
            }
        });

        mapToEntity(request, empleado);

        Empleado updated = empleadoRepository.save(empleado);
        return toDTO(updated);
    }

    @Transactional
    public void delete(Long id) {
        Empleado empleado = empleadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con id: " + id));
        empleadoRepository.delete(empleado);
    }

    @Transactional
    public EmpleadoDTO darDeBaja(Long id) {
        Empleado empleado = empleadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con id: " + id));

        empleado.setActivo(false);
        if (empleado.getFechaBaja() == null) {
            empleado.setFechaBaja(java.time.LocalDate.now());
        }

        Empleado updated = empleadoRepository.save(empleado);
        return toDTO(updated);
    }

    @Transactional
    public EmpleadoDTO reactivar(Long id) {
        Empleado empleado = empleadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con id: " + id));

        empleado.setActivo(true);
        empleado.setFechaBaja(null);

        Empleado updated = empleadoRepository.save(empleado);
        return toDTO(updated);
    }

    private void mapToEntity(EmpleadoRequest request, Empleado empleado) {
        empleado.setNombre(request.getNombre());
        empleado.setApellidos(request.getApellidos());
        empleado.setDni(request.getDni());
        empleado.setEmail(request.getEmail());
        empleado.setTelefono(request.getTelefono());
        empleado.setDireccion(request.getDireccion());
        empleado.setCargo(request.getCargo());
        empleado.setDepartamento(request.getDepartamento());
        empleado.setFechaAlta(request.getFechaAlta());
        empleado.setFechaBaja(request.getFechaBaja());
        empleado.setSalarioBase(request.getSalarioBase());
        empleado.setTipoContrato(request.getTipoContrato());
        empleado.setNumSeguridadSocial(request.getNumSeguridadSocial());
        empleado.setCuentaBancaria(request.getCuentaBancaria());
        empleado.setActivo(request.getActivo() != null ? request.getActivo() : true);
        empleado.setNotas(request.getNotas());
    }

    private EmpleadoDTO toDTO(Empleado empleado) {
        EmpleadoDTO dto = new EmpleadoDTO();
        dto.setId(empleado.getId());
        dto.setNombre(empleado.getNombre());
        dto.setApellidos(empleado.getApellidos());
        dto.setDni(empleado.getDni());
        dto.setEmail(empleado.getEmail());
        dto.setTelefono(empleado.getTelefono());
        dto.setDireccion(empleado.getDireccion());
        dto.setCargo(empleado.getCargo());
        dto.setDepartamento(empleado.getDepartamento());
        dto.setFechaAlta(empleado.getFechaAlta());
        dto.setFechaBaja(empleado.getFechaBaja());
        dto.setSalarioBase(empleado.getSalarioBase());
        dto.setTipoContrato(empleado.getTipoContrato());
        dto.setNumSeguridadSocial(empleado.getNumSeguridadSocial());
        dto.setCuentaBancaria(empleado.getCuentaBancaria());
        dto.setActivo(empleado.getActivo());
        dto.setNotas(empleado.getNotas());
        dto.setCreadoEn(empleado.getCreadoEn());
        dto.setActualizadoEn(empleado.getActualizadoEn());
        return dto;
    }
}
