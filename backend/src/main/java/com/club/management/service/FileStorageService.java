package com.club.management.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Servicio para gestión de almacenamiento de archivos
 */
@Service
@Slf4j
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService(@Value("${app.file-storage.upload-dir:uploads}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
            log.info("Directorio de almacenamiento creado/verificado: {}", this.fileStorageLocation);
        } catch (Exception ex) {
            log.error("No se pudo crear el directorio de almacenamiento", ex);
            throw new RuntimeException("No se pudo crear el directorio de almacenamiento", ex);
        }
    }

    /**
     * Almacenar archivo y retornar el nombre único generado
     */
    public String storeFile(MultipartFile file) {
        // Limpiar el nombre del archivo
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());

        try {
            // Validar el nombre del archivo
            if (originalFileName.contains("..")) {
                throw new RuntimeException("El nombre del archivo contiene una secuencia de ruta inválida: " + originalFileName);
            }

            // Generar nombre único para evitar colisiones
            String fileExtension = "";
            int lastDotIndex = originalFileName.lastIndexOf('.');
            if (lastDotIndex > 0) {
                fileExtension = originalFileName.substring(lastDotIndex);
            }

            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;

            // Copiar archivo a la ubicación de destino
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }

            log.info("Archivo almacenado exitosamente: {} -> {}", originalFileName, uniqueFileName);
            return uniqueFileName;

        } catch (IOException ex) {
            log.error("Error al almacenar el archivo: {}", originalFileName, ex);
            throw new RuntimeException("Error al almacenar el archivo: " + originalFileName, ex);
        }
    }

    /**
     * Almacenar archivo en un subdirectorio específico
     */
    public String storeFileInSubdirectory(MultipartFile file, String subdirectory) {
        Path subDirectory = this.fileStorageLocation.resolve(subdirectory);

        try {
            Files.createDirectories(subDirectory);
        } catch (IOException ex) {
            log.error("Error al crear subdirectorio: {}", subdirectory, ex);
            throw new RuntimeException("Error al crear subdirectorio: " + subdirectory, ex);
        }

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());

        try {
            if (originalFileName.contains("..")) {
                throw new RuntimeException("El nombre del archivo contiene una secuencia de ruta inválida: " + originalFileName);
            }

            String fileExtension = "";
            int lastDotIndex = originalFileName.lastIndexOf('.');
            if (lastDotIndex > 0) {
                fileExtension = originalFileName.substring(lastDotIndex);
            }

            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
            Path targetLocation = subDirectory.resolve(uniqueFileName);

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }

            log.info("Archivo almacenado en subdirectorio: {}/{} -> {}", subdirectory, originalFileName, uniqueFileName);
            return subdirectory + "/" + uniqueFileName;

        } catch (IOException ex) {
            log.error("Error al almacenar archivo en subdirectorio: {}", originalFileName, ex);
            throw new RuntimeException("Error al almacenar archivo: " + originalFileName, ex);
        }
    }

    /**
     * Cargar archivo como Resource
     */
    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Archivo no encontrado: " + fileName);
            }
        } catch (MalformedURLException ex) {
            log.error("Error al cargar el archivo: {}", fileName, ex);
            throw new RuntimeException("Archivo no encontrado: " + fileName, ex);
        }
    }

    /**
     * Eliminar archivo
     */
    public boolean deleteFile(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            boolean deleted = Files.deleteIfExists(filePath);

            if (deleted) {
                log.info("Archivo eliminado exitosamente: {}", fileName);
            } else {
                log.warn("Archivo no encontrado para eliminar: {}", fileName);
            }

            return deleted;
        } catch (IOException ex) {
            log.error("Error al eliminar el archivo: {}", fileName, ex);
            return false;
        }
    }

    /**
     * Obtener el tamaño del archivo
     */
    public long getFileSize(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            return Files.size(filePath);
        } catch (IOException ex) {
            log.error("Error al obtener tamaño del archivo: {}", fileName, ex);
            return 0;
        }
    }

    /**
     * Verificar si un archivo existe
     */
    public boolean fileExists(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            return Files.exists(filePath);
        } catch (Exception ex) {
            log.error("Error al verificar existencia del archivo: {}", fileName, ex);
            return false;
        }
    }
}
