package com.club.management.controller;

import com.club.management.service.reports.ExcelExportService;
import com.club.management.service.reports.PdfReportService;
import lombok.RequiredArgsConstructor;
import net.sf.jasperreports.engine.JRException;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReportController {

    private final ExcelExportService excelExportService;
    private final PdfReportService pdfReportService;

    @GetMapping("/eventos/excel")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<byte[]> exportEventosExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        try {
            byte[] excelData = excelExportService.exportEventos(fechaInicio, fechaFin);
            String filename = String.format("eventos_%s_%s.xlsx",
                    fechaInicio.format(DateTimeFormatter.ISO_DATE),
                    fechaFin.format(DateTimeFormatter.ISO_DATE));

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelData);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/transacciones/excel")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_LECTURA')")
    public ResponseEntity<byte[]> exportTransaccionesExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        try {
            byte[] excelData = excelExportService.exportTransacciones(fechaInicio, fechaFin);
            String filename = String.format("transacciones_%s_%s.xlsx",
                    fechaInicio.format(DateTimeFormatter.ISO_DATE),
                    fechaFin.format(DateTimeFormatter.ISO_DATE));

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelData);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/nominas/excel")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH')")
    public ResponseEntity<byte[]> exportNominasExcel(
            @RequestParam Integer mes,
            @RequestParam Integer anio) {
        try {
            byte[] excelData = excelExportService.exportNominas(mes, anio);
            String filename = String.format("nominas_%d_%d.xlsx", mes, anio);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelData);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/inventario/excel")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<byte[]> exportInventarioExcel() {
        try {
            byte[] excelData = excelExportService.exportInventario();
            String filename = String.format("inventario_%s.xlsx",
                    LocalDate.now().format(DateTimeFormatter.ISO_DATE));

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelData);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/movimientos-stock/excel")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<byte[]> exportMovimientosStockExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        try {
            byte[] excelData = excelExportService.exportMovimientosStock(fechaInicio, fechaFin);
            String filename = String.format("movimientos_stock_%s_%s.xlsx",
                    fechaInicio.format(DateTimeFormatter.ISO_DATE),
                    fechaFin.format(DateTimeFormatter.ISO_DATE));

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelData);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ========== ENDPOINTS PARA EXPORTACIÓN PDF ==========

    @GetMapping("/nominas/pdf")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_RRHH')")
    public ResponseEntity<byte[]> exportNominasPdf(
            @RequestParam Integer mes,
            @RequestParam Integer anio) {
        try {
            byte[] pdfData = pdfReportService.generateNominasPdf(mes, anio);
            String filename = String.format("nominas_%d_%d.pdf", mes, anio);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfData);
        } catch (JRException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/eventos/pdf")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_ENCARGADO', 'ROLE_LECTURA')")
    public ResponseEntity<byte[]> exportEventosPdf(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        try {
            byte[] pdfData = pdfReportService.generateEventosPdf(fechaInicio, fechaFin);
            String filename = String.format("eventos_%s_%s.pdf",
                    fechaInicio.format(DateTimeFormatter.ISO_DATE),
                    fechaFin.format(DateTimeFormatter.ISO_DATE));

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfData);
        } catch (JRException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/profit-loss/pdf")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_LECTURA')")
    public ResponseEntity<byte[]> exportProfitLossPdf(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        try {
            byte[] pdfData = pdfReportService.generateProfitLossPdf(fechaInicio, fechaFin);
            String filename = String.format("profit_loss_%s_%s.pdf",
                    fechaInicio.format(DateTimeFormatter.ISO_DATE),
                    fechaFin.format(DateTimeFormatter.ISO_DATE));

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfData);
        } catch (JRException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/transacciones/pdf")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_LECTURA')")
    public ResponseEntity<byte[]> exportTransaccionesPdf(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        try {
            byte[] pdfData = pdfReportService.generateTransaccionesPdf(fechaInicio, fechaFin);
            String filename = String.format("transacciones_%s_%s.pdf",
                    fechaInicio.format(DateTimeFormatter.ISO_DATE),
                    fechaFin.format(DateTimeFormatter.ISO_DATE));

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfData);
        } catch (JRException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
