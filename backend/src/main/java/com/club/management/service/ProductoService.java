package com.club.management.service;

import com.club.management.dto.request.ProductoFormData;
import com.club.management.dto.response.ProductoDTO;
import com.club.management.entity.Producto;
import com.club.management.entity.Proveedor;
import com.club.management.repository.ProductoRepository;
import com.club.management.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final ProveedorRepository proveedorRepository;

    @Transactional(readOnly = true)
    public List<ProductoDTO> getAllProductos() {
        return productoRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductoDTO> getProductosActivos() {
        return productoRepository.findByActivoTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductoDTO getProductoById(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        return toDTO(producto);
    }

    @Transactional(readOnly = true)
    public List<String> getCategorias() {
        return productoRepository.findAllCategorias();
    }

    @Transactional(readOnly = true)
    public List<ProductoDTO> getProductosBajoStock() {
        return productoRepository.findProductosBajoStock().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductoDTO crearProducto(ProductoFormData formData) {
        // Verificar que el código no exista
        if (productoRepository.findByCodigo(formData.getCodigo()).isPresent()) {
            throw new RuntimeException("Ya existe un producto con el código: " + formData.getCodigo());
        }

        Producto producto = new Producto();
        mapearDatosProducto(producto, formData);
        Producto saved = productoRepository.save(producto);
        return toDTO(saved);
    }

    @Transactional
    public ProductoDTO actualizarProducto(Long id, ProductoFormData formData) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Verificar código único si cambió
        if (!producto.getCodigo().equals(formData.getCodigo())) {
            if (productoRepository.findByCodigo(formData.getCodigo()).isPresent()) {
                throw new RuntimeException("Ya existe un producto con el código: " + formData.getCodigo());
            }
        }

        mapearDatosProducto(producto, formData);
        Producto updated = productoRepository.save(producto);
        return toDTO(updated);
    }

    @Transactional
    public void eliminarProducto(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        producto.setActivo(false);
        productoRepository.save(producto);
    }

    private void mapearDatosProducto(Producto producto, ProductoFormData formData) {
        producto.setCodigo(formData.getCodigo());
        producto.setNombre(formData.getNombre());
        producto.setDescripcion(formData.getDescripcion());
        producto.setCategoria(formData.getCategoria());
        producto.setUnidadMedida(formData.getUnidadMedida());
        producto.setPrecioCompra(formData.getPrecioCompra());
        producto.setPrecioVenta(formData.getPrecioVenta());
        producto.setStockMinimo(formData.getStockMinimo());
        producto.setStockMaximo(formData.getStockMaximo());
        producto.setActivo(formData.getActivo() != null ? formData.getActivo() : true);
        producto.setPerecedero(formData.getPerecedero() != null ? formData.getPerecedero() : false);
        producto.setDiasCaducidad(formData.getDiasCaducidad());
        producto.setImagenUrl(formData.getImagenUrl());
        producto.setNotas(formData.getNotas());

        if (formData.getProveedorId() != null) {
            Proveedor proveedor = proveedorRepository.findById(formData.getProveedorId())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
            producto.setProveedor(proveedor);
        }

        // Si es creación y tiene stock, asignarlo
        if (producto.getId() == null && formData.getStockActual() != null) {
            producto.setStockActual(formData.getStockActual());
        }
    }

    private ProductoDTO toDTO(Producto producto) {
        ProductoDTO dto = new ProductoDTO();
        dto.setId(producto.getId());
        dto.setCodigo(producto.getCodigo());
        dto.setNombre(producto.getNombre());
        dto.setDescripcion(producto.getDescripcion());
        dto.setCategoria(producto.getCategoria());
        dto.setUnidadMedida(producto.getUnidadMedida());
        dto.setPrecioCompra(producto.getPrecioCompra());
        dto.setPrecioVenta(producto.getPrecioVenta());
        dto.setMargenBeneficio(producto.getMargenBeneficio());
        dto.setStockActual(producto.getStockActual());
        dto.setStockMinimo(producto.getStockMinimo());
        dto.setStockMaximo(producto.getStockMaximo());
        dto.setActivo(producto.getActivo());
        dto.setPerecedero(producto.getPerecedero());
        dto.setDiasCaducidad(producto.getDiasCaducidad());
        dto.setImagenUrl(producto.getImagenUrl());
        dto.setBajoStock(producto.isBajoStock());
        dto.setSinStock(producto.isSinStock());
        dto.setNotas(producto.getNotas());
        dto.setCreadoEn(producto.getCreadoEn());
        dto.setActualizadoEn(producto.getActualizadoEn());

        if (producto.getProveedor() != null) {
            dto.setProveedorId(producto.getProveedor().getId());
            dto.setProveedorNombre(producto.getProveedor().getNombre());
        }

        return dto;
    }
}
