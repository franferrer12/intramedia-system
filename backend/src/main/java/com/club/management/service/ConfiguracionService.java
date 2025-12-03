package com.club.management.service;

import com.club.management.dto.ConfiguracionSistemaDTO;
import com.club.management.entity.ConfiguracionSistema;
import com.club.management.entity.Usuario;
import com.club.management.repository.ConfiguracionSistemaRepository;
import com.club.management.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConfiguracionService {

    private final ConfiguracionSistemaRepository configuracionRepository;
    private final UsuarioRepository usuarioRepository;

    /**
     * Get all configurations
     */
    @Transactional(readOnly = true)
    @Cacheable("configuraciones")
    public List<ConfiguracionSistemaDTO> getAllConfiguraciones() {
        return configuracionRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get configurations by category
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "configuracionesPorCategoria", key = "#categoria")
    public List<ConfiguracionSistemaDTO> getConfiguracionesByCategoria(String categoria) {
        return configuracionRepository.findByCategoriaOrdered(categoria)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all categories
     */
    @Transactional(readOnly = true)
    public List<String> getCategorias() {
        return configuracionRepository.findDistinctCategorias();
    }

    /**
     * Get configuration by key
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "configuracionPorClave", key = "#clave")
    public ConfiguracionSistemaDTO getConfiguracion(String clave) {
        return configuracionRepository.findByClave(clave)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Configuración no encontrada: " + clave));
    }

    /**
     * Get configuration value as String
     */
    @Transactional(readOnly = true)
    public String getValorString(String clave, String defaultValue) {
        return configuracionRepository.findByClave(clave)
                .map(ConfiguracionSistema::getValorString)
                .orElse(defaultValue);
    }

    /**
     * Get configuration value as Integer
     */
    @Transactional(readOnly = true)
    public Integer getValorInteger(String clave, Integer defaultValue) {
        return configuracionRepository.findByClave(clave)
                .map(ConfiguracionSistema::getValorInteger)
                .orElse(defaultValue);
    }

    /**
     * Get configuration value as Double
     */
    @Transactional(readOnly = true)
    public Double getValorDouble(String clave, Double defaultValue) {
        return configuracionRepository.findByClave(clave)
                .map(ConfiguracionSistema::getValorDouble)
                .orElse(defaultValue);
    }

    /**
     * Get configuration value as Boolean
     */
    @Transactional(readOnly = true)
    public Boolean getValorBoolean(String clave, Boolean defaultValue) {
        return configuracionRepository.findByClave(clave)
                .map(ConfiguracionSistema::getValorBoolean)
                .orElse(defaultValue);
    }

    /**
     * Update configuration value
     */
    @Transactional
    @CacheEvict(value = {"configuraciones", "configuracionesPorCategoria", "configuracionPorClave"}, allEntries = true)
    public ConfiguracionSistemaDTO updateConfiguracion(String clave, String nuevoValor, Long usuarioId) {
        ConfiguracionSistema config = configuracionRepository.findByClave(clave)
                .orElseThrow(() -> new RuntimeException("Configuración no encontrada: " + clave));

        // Validate value according to type
        validateValue(config.getTipo(), nuevoValor);

        config.setValor(nuevoValor);

        if (usuarioId != null) {
            usuarioRepository.findById(usuarioId).ifPresent(config::setModificadoPor);
        }

        ConfiguracionSistema saved = configuracionRepository.save(config);
        return mapToDTO(saved);
    }

    /**
     * Create new configuration
     */
    @Transactional
    @CacheEvict(value = {"configuraciones", "configuracionesPorCategoria"}, allEntries = true)
    public ConfiguracionSistemaDTO crearConfiguracion(ConfiguracionSistemaDTO dto, Long usuarioId) {
        if (configuracionRepository.existsByClave(dto.getClave())) {
            throw new RuntimeException("Ya existe una configuración con la clave: " + dto.getClave());
        }

        validateValue(ConfiguracionSistema.TipoValor.valueOf(dto.getTipo()), dto.getValor());

        ConfiguracionSistema config = ConfiguracionSistema.builder()
                .clave(dto.getClave())
                .valor(dto.getValor())
                .tipo(ConfiguracionSistema.TipoValor.valueOf(dto.getTipo()))
                .categoria(dto.getCategoria())
                .descripcion(dto.getDescripcion())
                .build();

        if (usuarioId != null) {
            usuarioRepository.findById(usuarioId).ifPresent(config::setModificadoPor);
        }

        ConfiguracionSistema saved = configuracionRepository.save(config);
        return mapToDTO(saved);
    }

    /**
     * Delete configuration
     */
    @Transactional
    @CacheEvict(value = {"configuraciones", "configuracionesPorCategoria", "configuracionPorClave"}, allEntries = true)
    public void eliminarConfiguracion(String clave) {
        ConfiguracionSistema config = configuracionRepository.findByClave(clave)
                .orElseThrow(() -> new RuntimeException("Configuración no encontrada: " + clave));
        configuracionRepository.delete(config);
    }

    /**
     * Search configurations
     */
    @Transactional(readOnly = true)
    public List<ConfiguracionSistemaDTO> buscarConfiguraciones(String busqueda) {
        return configuracionRepository.buscar(busqueda)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get configuration map for easy access
     */
    @Transactional(readOnly = true)
    public Map<String, String> getConfiguracionMap() {
        return configuracionRepository.findAll()
                .stream()
                .collect(Collectors.toMap(
                        ConfiguracionSistema::getClave,
                        ConfiguracionSistema::getValor
                ));
    }

    // Helper methods

    private void validateValue(ConfiguracionSistema.TipoValor tipo, String valor) {
        switch (tipo) {
            case NUMBER:
                try {
                    Double.parseDouble(valor);
                } catch (NumberFormatException e) {
                    throw new RuntimeException("Valor inválido para tipo NUMBER: " + valor);
                }
                break;
            case BOOLEAN:
                if (!valor.equalsIgnoreCase("true") && !valor.equalsIgnoreCase("false")) {
                    throw new RuntimeException("Valor inválido para tipo BOOLEAN: " + valor + " (debe ser 'true' o 'false')");
                }
                break;
            case JSON:
                // Basic JSON validation - could be enhanced
                if (!valor.trim().startsWith("{") && !valor.trim().startsWith("[")) {
                    throw new RuntimeException("Valor inválido para tipo JSON: debe comenzar con '{' o '['");
                }
                break;
            case STRING:
                // No validation needed
                break;
        }
    }

    private ConfiguracionSistemaDTO mapToDTO(ConfiguracionSistema config) {
        return ConfiguracionSistemaDTO.builder()
                .id(config.getId())
                .clave(config.getClave())
                .valor(config.getValor())
                .tipo(config.getTipo().name())
                .categoria(config.getCategoria())
                .descripcion(config.getDescripcion())
                .modificadoPorId(config.getModificadoPor() != null ? config.getModificadoPor().getId() : null)
                .modificadoPorNombre(config.getModificadoPor() != null ? config.getModificadoPor().getUsername() : null)
                .fechaModificacion(config.getFechaModificacion())
                .build();
    }
}
