package com.club.management.service.reports;

import com.club.management.entity.*;
import com.club.management.repository.*;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExcelExportService {

    private final EventoRepository eventoRepository;
    private final TransaccionRepository transaccionRepository;
    private final NominaRepository nominaRepository;
    private final ProductoRepository productoRepository;
    private final MovimientoStockRepository movimientoStockRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public byte[] exportEventos(LocalDate fechaInicio, LocalDate fechaFin) throws IOException {
        List<Evento> eventos = eventoRepository.findByFechaBetween(fechaInicio, fechaFin.plusDays(1));

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Eventos");

            // Estilos
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);

            // Header
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Nombre", "Tipo", "Fecha", "Capacidad", "Asistentes", "Ingresos Esperados", "Gastos Estimados", "Estado"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Datos
            int rowNum = 1;
            for (Evento evento : eventos) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(evento.getId());
                row.createCell(1).setCellValue(evento.getNombre());
                row.createCell(2).setCellValue(evento.getTipo().toString());

                Cell dateCell = row.createCell(3);
                dateCell.setCellValue(evento.getFecha().toString()); // LocalDate to String
                dateCell.setCellStyle(dateStyle);

                row.createCell(4).setCellValue(evento.getAforoEsperado() != null ? evento.getAforoEsperado() : 0);
                row.createCell(5).setCellValue(evento.getAforoReal() != null ? evento.getAforoReal() : 0);

                Cell ingresosCell = row.createCell(6);
                ingresosCell.setCellValue(evento.getIngresosEstimados() != null ? evento.getIngresosEstimados().doubleValue() : 0.0);
                ingresosCell.setCellStyle(currencyStyle);

                Cell gastosCell = row.createCell(7);
                gastosCell.setCellValue(evento.getGastosEstimados() != null ? evento.getGastosEstimados().doubleValue() : 0.0);
                gastosCell.setCellStyle(currencyStyle);

                row.createCell(8).setCellValue(evento.getEstado().toString());
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportTransacciones(LocalDate fechaInicio, LocalDate fechaFin) throws IOException {
        List<Transaccion> transacciones = transaccionRepository.findByFechaBetween(fechaInicio, fechaFin.plusDays(1));

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Transacciones");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);

            // Header
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Fecha", "Tipo", "Categoría", "Concepto", "Monto", "Método Pago", "Evento", "Estado"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Datos
            int rowNum = 1;
            BigDecimal totalIngresos = BigDecimal.ZERO;
            BigDecimal totalGastos = BigDecimal.ZERO;

            for (Transaccion tx : transacciones) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(tx.getId());

                Cell dateCell = row.createCell(1);
                dateCell.setCellValue(tx.getFecha().format(DATE_FORMATTER));
                dateCell.setCellStyle(dateStyle);

                row.createCell(2).setCellValue(tx.getTipo().toString());
                row.createCell(3).setCellValue(tx.getCategoria() != null ? tx.getCategoria().getNombre() : "");
                row.createCell(4).setCellValue(tx.getConcepto());

                Cell montoCell = row.createCell(5);
                montoCell.setCellValue(tx.getMonto().doubleValue());
                montoCell.setCellStyle(currencyStyle);

                row.createCell(6).setCellValue(tx.getMetodoPago());
                row.createCell(7).setCellValue(tx.getEvento() != null ? tx.getEvento().getNombre() : "");
                row.createCell(8).setCellValue("-"); // Estado not in entity

                if (tx.getTipo().toString().equals("INGRESO")) {
                    totalIngresos = totalIngresos.add(tx.getMonto());
                } else if (tx.getTipo().toString().equals("GASTO")) {
                    totalGastos = totalGastos.add(tx.getMonto());
                }
            }

            // Totales
            rowNum++;
            Row totalRow = sheet.createRow(rowNum);
            totalRow.createCell(4).setCellValue("TOTALES:");

            Cell totalIngresosCell = totalRow.createCell(5);
            totalIngresosCell.setCellValue(totalIngresos.doubleValue());
            totalIngresosCell.setCellStyle(currencyStyle);

            rowNum++;
            Row gastosRow = sheet.createRow(rowNum);
            gastosRow.createCell(4).setCellValue("Total Gastos:");
            Cell totalGastosCell = gastosRow.createCell(5);
            totalGastosCell.setCellValue(totalGastos.doubleValue());
            totalGastosCell.setCellStyle(currencyStyle);

            rowNum++;
            Row balanceRow = sheet.createRow(rowNum);
            balanceRow.createCell(4).setCellValue("Balance:");
            Cell balanceCell = balanceRow.createCell(5);
            balanceCell.setCellValue(totalIngresos.subtract(totalGastos).doubleValue());
            balanceCell.setCellStyle(currencyStyle);

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportNominas(Integer mes, Integer anio) throws IOException {
        String periodo = String.format("%04d-%02d", anio, mes);
        List<Nomina> nominas = nominaRepository.findByPeriodo(periodo);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Nóminas " + mes + "-" + anio);

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);

            // Header
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Empleado", "Mes", "Año", "Salario Base", "Horas Extra", "Bonos", "Deducciones", "Salario Neto", "Estado", "Fecha Pago"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Datos
            int rowNum = 1;
            BigDecimal totalNeto = BigDecimal.ZERO;

            for (Nomina nomina : nominas) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(nomina.getId());
                row.createCell(1).setCellValue(nomina.getEmpleado().getNombre() + " " + nomina.getEmpleado().getApellidos());
                row.createCell(2).setCellValue(nomina.getPeriodo());
                row.createCell(3).setCellValue("-"); // No separate year field

                Cell salarioBaseCell = row.createCell(4);
                salarioBaseCell.setCellValue(nomina.getSalarioBase().doubleValue());
                salarioBaseCell.setCellStyle(currencyStyle);

                Cell horasExtraCell = row.createCell(5);
                BigDecimal totalHorasExtra = nomina.getHorasExtra().multiply(nomina.getPrecioHoraExtra());
                horasExtraCell.setCellValue(totalHorasExtra.doubleValue());
                horasExtraCell.setCellStyle(currencyStyle);

                Cell bonosCell = row.createCell(6);
                bonosCell.setCellValue(nomina.getBonificaciones().doubleValue());
                bonosCell.setCellStyle(currencyStyle);

                Cell deduccionesCell = row.createCell(7);
                deduccionesCell.setCellValue(nomina.getDeducciones().doubleValue());
                deduccionesCell.setCellStyle(currencyStyle);

                Cell netoCell = row.createCell(8);
                netoCell.setCellValue(nomina.getSalarioNeto().doubleValue());
                netoCell.setCellStyle(currencyStyle);

                row.createCell(9).setCellValue(nomina.getEstado());

                if (nomina.getFechaPago() != null) {
                    Cell fechaPagoCell = row.createCell(10);
                    fechaPagoCell.setCellValue(nomina.getFechaPago().format(DATE_FORMATTER));
                    fechaPagoCell.setCellStyle(dateStyle);
                }

                totalNeto = totalNeto.add(nomina.getSalarioNeto());
            }

            // Total
            rowNum++;
            Row totalRow = sheet.createRow(rowNum);
            totalRow.createCell(7).setCellValue("TOTAL NETO:");
            Cell totalCell = totalRow.createCell(8);
            totalCell.setCellValue(totalNeto.doubleValue());
            totalCell.setCellStyle(currencyStyle);

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportInventario() throws IOException {
        List<Producto> productos = productoRepository.findAll();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Inventario");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle percentStyle = createPercentStyle(workbook);

            // Header
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Código", "Nombre", "Categoría", "Stock Actual", "Stock Mínimo", "Unidad", "Precio Compra", "Precio Venta", "Margen %", "Valor Stock", "Proveedor", "Estado"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Datos
            int rowNum = 1;
            BigDecimal valorTotalStock = BigDecimal.ZERO;

            for (Producto p : productos) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(p.getCodigo());
                row.createCell(1).setCellValue(p.getNombre());
                row.createCell(2).setCellValue(p.getCategoria());
                row.createCell(3).setCellValue(p.getStockActual().doubleValue());
                row.createCell(4).setCellValue(p.getStockMinimo().doubleValue());
                row.createCell(5).setCellValue(p.getUnidadMedida());

                Cell precioCompraCell = row.createCell(6);
                precioCompraCell.setCellValue(p.getPrecioCompra().doubleValue());
                precioCompraCell.setCellStyle(currencyStyle);

                Cell precioVentaCell = row.createCell(7);
                precioVentaCell.setCellValue(p.getPrecioVenta().doubleValue());
                precioVentaCell.setCellStyle(currencyStyle);

                Cell margenCell = row.createCell(8);
                margenCell.setCellValue(p.getMargenBeneficio().doubleValue() / 100);
                margenCell.setCellStyle(percentStyle);

                BigDecimal valorStock = p.getPrecioCompra().multiply(p.getStockActual());
                Cell valorStockCell = row.createCell(9);
                valorStockCell.setCellValue(valorStock.doubleValue());
                valorStockCell.setCellStyle(currencyStyle);

                row.createCell(10).setCellValue(p.getProveedor() != null ? p.getProveedor().getNombre() : "");
                row.createCell(11).setCellValue(p.getActivo() ? "Activo" : "Inactivo");

                valorTotalStock = valorTotalStock.add(valorStock);
            }

            // Total
            rowNum++;
            Row totalRow = sheet.createRow(rowNum);
            totalRow.createCell(8).setCellValue("VALOR TOTAL STOCK:");
            Cell totalCell = totalRow.createCell(9);
            totalCell.setCellValue(valorTotalStock.doubleValue());
            totalCell.setCellStyle(currencyStyle);

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportMovimientosStock(LocalDate fechaInicio, LocalDate fechaFin) throws IOException {
        List<MovimientoStock> movimientos = movimientoStockRepository.findByFechaMovimientoBetween(
                fechaInicio.atStartOfDay(), fechaFin.plusDays(1).atStartOfDay());

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Movimientos Stock");

            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);

            // Header
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Fecha", "Producto", "Tipo", "Cantidad", "Stock Anterior", "Stock Nuevo", "Precio Unit.", "Costo Total", "Motivo", "Referencia", "Usuario"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Datos
            int rowNum = 1;
            for (MovimientoStock mov : movimientos) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(mov.getId());

                Cell dateCell = row.createCell(1);
                dateCell.setCellValue(mov.getFechaMovimiento().format(DATETIME_FORMATTER));
                dateCell.setCellStyle(dateStyle);

                row.createCell(2).setCellValue(mov.getProducto().getNombre());
                row.createCell(3).setCellValue(mov.getTipoMovimiento());
                row.createCell(4).setCellValue(mov.getCantidad().doubleValue());
                row.createCell(5).setCellValue(mov.getStockAnterior().doubleValue());
                row.createCell(6).setCellValue(mov.getStockNuevo().doubleValue());

                if (mov.getPrecioUnitario() != null) {
                    Cell precioCell = row.createCell(7);
                    precioCell.setCellValue(mov.getPrecioUnitario().doubleValue());
                    precioCell.setCellStyle(currencyStyle);
                }

                if (mov.getCostoTotal() != null) {
                    Cell costoCell = row.createCell(8);
                    costoCell.setCellValue(mov.getCostoTotal().doubleValue());
                    costoCell.setCellStyle(currencyStyle);
                }

                row.createCell(9).setCellValue(mov.getMotivo() != null ? mov.getMotivo() : "");
                row.createCell(10).setCellValue(mov.getReferencia() != null ? mov.getReferencia() : "");
                row.createCell(11).setCellValue(mov.getUsuario() != null ? mov.getUsuario().getUsername() : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // Métodos auxiliares para estilos
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setDataFormat(workbook.createDataFormat().getFormat("dd/mm/yyyy"));
        return style;
    }

    private CellStyle createCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setDataFormat(workbook.createDataFormat().getFormat("€#,##0.00"));
        return style;
    }

    private CellStyle createPercentStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setDataFormat(workbook.createDataFormat().getFormat("0.00%"));
        return style;
    }
}
