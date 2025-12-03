package com.club.management.service.reports;

import com.club.management.entity.*;
import com.club.management.repository.*;
import lombok.RequiredArgsConstructor;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.design.*;
import net.sf.jasperreports.engine.type.HorizontalTextAlignEnum;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PdfReportService {

    private final EventoRepository eventoRepository;
    private final TransaccionRepository transaccionRepository;
    private final NominaRepository nominaRepository;
    private final ProductoRepository productoRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Genera PDF de nóminas de un mes específico
     */
    public byte[] generateNominasPdf(Integer mes, Integer anio) throws JRException {
        String periodo = String.format("%04d-%02d", anio, mes);
        List<Nomina> nominas = nominaRepository.findByPeriodo(periodo);

        // Crear diseño del reporte
        JasperDesign jasperDesign = createNominasDesign();
        JasperReport jasperReport = JasperCompileManager.compileReport(jasperDesign);

        // Preparar datos
        List<Map<String, Object>> dataList = nominas.stream().map(n -> {
            Map<String, Object> map = new HashMap<>();
            map.put("empleado", n.getEmpleado().getNombre() + " " + n.getEmpleado().getApellidos());
            map.put("salarioBase", n.getSalarioBase());
            map.put("horasExtra", n.getHorasExtra().multiply(n.getPrecioHoraExtra()));
            map.put("bonificaciones", n.getBonificaciones());
            map.put("deducciones", n.getDeducciones());
            map.put("salarioNeto", n.getSalarioNeto());
            map.put("estado", n.getEstado());
            return map;
        }).collect(Collectors.toList());

        // Parámetros
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("titulo", "NÓMINAS - " + getMesNombre(mes) + " " + anio);
        parameters.put("fechaGeneracion", LocalDate.now().format(DATE_FORMATTER));
        BigDecimal totalNeto = nominas.stream()
                .map(Nomina::getSalarioNeto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        parameters.put("totalNeto", totalNeto);

        // Generar PDF
        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(dataList);
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
        return outputStream.toByteArray();
    }

    /**
     * Genera PDF de eventos
     */
    public byte[] generateEventosPdf(LocalDate fechaInicio, LocalDate fechaFin) throws JRException {
        List<Evento> eventos = eventoRepository.findByFechaBetween(fechaInicio, fechaFin.plusDays(1));

        JasperDesign jasperDesign = createEventosDesign();
        JasperReport jasperReport = JasperCompileManager.compileReport(jasperDesign);

        List<Map<String, Object>> dataList = eventos.stream().map(e -> {
            Map<String, Object> map = new HashMap<>();
            map.put("nombre", e.getNombre());
            map.put("tipo", e.getTipo().toString());
            map.put("fecha", e.getFecha().format(DATE_FORMATTER));
            map.put("aforoEsperado", e.getAforoEsperado());
            map.put("aforoReal", e.getAforoReal() != null ? e.getAforoReal() : 0);
            map.put("ingresosEstimados", e.getIngresosEstimados());
            map.put("gastosEstimados", e.getGastosEstimados());
            map.put("beneficio", e.getIngresosEstimados().subtract(e.getGastosEstimados()));
            map.put("estado", e.getEstado().toString());
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("titulo", "REPORTE DE EVENTOS");
        parameters.put("periodo", fechaInicio.format(DATE_FORMATTER) + " - " + fechaFin.format(DATE_FORMATTER));
        parameters.put("fechaGeneracion", LocalDate.now().format(DATE_FORMATTER));

        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(dataList);
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
        return outputStream.toByteArray();
    }

    /**
     * Genera PDF de P&L (Profit & Loss)
     */
    public byte[] generateProfitLossPdf(LocalDate fechaInicio, LocalDate fechaFin) throws JRException {
        List<Transaccion> transacciones = transaccionRepository.findByFechaBetween(fechaInicio, fechaFin.plusDays(1));

        BigDecimal totalIngresos = transacciones.stream()
                .filter(t -> t.getTipo().toString().equals("INGRESO"))
                .map(Transaccion::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalGastos = transacciones.stream()
                .filter(t -> t.getTipo().toString().equals("GASTO"))
                .map(Transaccion::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal balance = totalIngresos.subtract(totalGastos);

        JasperDesign jasperDesign = createProfitLossDesign();
        JasperReport jasperReport = JasperCompileManager.compileReport(jasperDesign);

        List<Map<String, Object>> dataList = new ArrayList<>();
        Map<String, Object> resumen = new HashMap<>();
        resumen.put("concepto", "Ingresos Totales");
        resumen.put("monto", totalIngresos);
        dataList.add(resumen);

        resumen = new HashMap<>();
        resumen.put("concepto", "Gastos Totales");
        resumen.put("monto", totalGastos);
        dataList.add(resumen);

        resumen = new HashMap<>();
        resumen.put("concepto", "BALANCE NETO");
        resumen.put("monto", balance);
        dataList.add(resumen);

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("titulo", "ESTADO DE RESULTADOS (P&L)");
        parameters.put("periodo", fechaInicio.format(DATE_FORMATTER) + " - " + fechaFin.format(DATE_FORMATTER));
        parameters.put("fechaGeneracion", LocalDate.now().format(DATE_FORMATTER));
        parameters.put("totalIngresos", totalIngresos);
        parameters.put("totalGastos", totalGastos);
        parameters.put("balance", balance);

        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(dataList);
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
        return outputStream.toByteArray();
    }

    /**
     * Genera PDF de transacciones
     */
    public byte[] generateTransaccionesPdf(LocalDate fechaInicio, LocalDate fechaFin) throws JRException {
        List<Transaccion> transacciones = transaccionRepository.findByFechaBetween(fechaInicio, fechaFin.plusDays(1));

        JasperDesign jasperDesign = createTransaccionesDesign();
        JasperReport jasperReport = JasperCompileManager.compileReport(jasperDesign);

        List<Map<String, Object>> dataList = transacciones.stream().map(t -> {
            Map<String, Object> map = new HashMap<>();
            map.put("fecha", t.getFecha().format(DATE_FORMATTER));
            map.put("tipo", t.getTipo().toString());
            map.put("categoria", t.getCategoria() != null ? t.getCategoria().getNombre() : "");
            map.put("concepto", t.getConcepto());
            map.put("monto", t.getMonto());
            map.put("metodoPago", t.getMetodoPago());
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("titulo", "REPORTE DE TRANSACCIONES");
        parameters.put("periodo", fechaInicio.format(DATE_FORMATTER) + " - " + fechaFin.format(DATE_FORMATTER));
        parameters.put("fechaGeneracion", LocalDate.now().format(DATE_FORMATTER));

        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(dataList);
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
        return outputStream.toByteArray();
    }

    // ===== DISEÑOS DE REPORTES =====

    private JasperDesign createNominasDesign() throws JRException {
        JasperDesign design = new JasperDesign();
        design.setName("NominasReport");
        design.setPageWidth(595);
        design.setPageHeight(842);
        design.setColumnWidth(535);
        design.setLeftMargin(30);
        design.setRightMargin(30);
        design.setTopMargin(20);
        design.setBottomMargin(20);

        // Campos
        addField(design, "empleado", String.class);
        addField(design, "salarioBase", BigDecimal.class);
        addField(design, "horasExtra", BigDecimal.class);
        addField(design, "bonificaciones", BigDecimal.class);
        addField(design, "deducciones", BigDecimal.class);
        addField(design, "salarioNeto", BigDecimal.class);
        addField(design, "estado", String.class);

        // Parámetros
        addParameter(design, "titulo", String.class);
        addParameter(design, "fechaGeneracion", String.class);
        addParameter(design, "totalNeto", BigDecimal.class);

        // Bandas
        addTitleBand(design, "$P{titulo}");
        addColumnHeaderBand(design, new String[]{"Empleado", "Salario Base", "Horas Extra", "Bonos", "Deducciones", "Neto", "Estado"});
        addDetailBand(design, new String[]{"empleado", "salarioBase", "horasExtra", "bonificaciones", "deducciones", "salarioNeto", "estado"});

        return design;
    }

    private JasperDesign createEventosDesign() throws JRException {
        JasperDesign design = new JasperDesign();
        design.setName("EventosReport");
        design.setPageWidth(842);
        design.setPageHeight(595);
        design.setColumnWidth(782);
        design.setLeftMargin(30);
        design.setRightMargin(30);
        design.setTopMargin(20);
        design.setBottomMargin(20);
        design.setOrientation(net.sf.jasperreports.engine.type.OrientationEnum.LANDSCAPE);

        addField(design, "nombre", String.class);
        addField(design, "tipo", String.class);
        addField(design, "fecha", String.class);
        addField(design, "aforoEsperado", Integer.class);
        addField(design, "aforoReal", Integer.class);
        addField(design, "ingresosEstimados", BigDecimal.class);
        addField(design, "gastosEstimados", BigDecimal.class);
        addField(design, "beneficio", BigDecimal.class);
        addField(design, "estado", String.class);

        addParameter(design, "titulo", String.class);
        addParameter(design, "periodo", String.class);
        addParameter(design, "fechaGeneracion", String.class);

        addTitleBand(design, "$P{titulo}");
        addColumnHeaderBand(design, new String[]{"Nombre", "Tipo", "Fecha", "Aforo Esp.", "Aforo Real", "Ingresos", "Gastos", "Beneficio", "Estado"});
        addDetailBand(design, new String[]{"nombre", "tipo", "fecha", "aforoEsperado", "aforoReal", "ingresosEstimados", "gastosEstimados", "beneficio", "estado"});

        return design;
    }

    private JasperDesign createProfitLossDesign() throws JRException {
        JasperDesign design = new JasperDesign();
        design.setName("ProfitLossReport");
        design.setPageWidth(595);
        design.setPageHeight(842);
        design.setColumnWidth(535);
        design.setLeftMargin(30);
        design.setRightMargin(30);
        design.setTopMargin(20);
        design.setBottomMargin(20);

        addField(design, "concepto", String.class);
        addField(design, "monto", BigDecimal.class);

        addParameter(design, "titulo", String.class);
        addParameter(design, "periodo", String.class);
        addParameter(design, "fechaGeneracion", String.class);
        addParameter(design, "totalIngresos", BigDecimal.class);
        addParameter(design, "totalGastos", BigDecimal.class);
        addParameter(design, "balance", BigDecimal.class);

        addTitleBand(design, "$P{titulo}");
        addColumnHeaderBand(design, new String[]{"Concepto", "Monto"});
        addDetailBand(design, new String[]{"concepto", "monto"});

        return design;
    }

    private JasperDesign createTransaccionesDesign() throws JRException {
        JasperDesign design = new JasperDesign();
        design.setName("TransaccionesReport");
        design.setPageWidth(595);
        design.setPageHeight(842);
        design.setColumnWidth(535);
        design.setLeftMargin(30);
        design.setRightMargin(30);
        design.setTopMargin(20);
        design.setBottomMargin(20);

        addField(design, "fecha", String.class);
        addField(design, "tipo", String.class);
        addField(design, "categoria", String.class);
        addField(design, "concepto", String.class);
        addField(design, "monto", BigDecimal.class);
        addField(design, "metodoPago", String.class);

        addParameter(design, "titulo", String.class);
        addParameter(design, "periodo", String.class);
        addParameter(design, "fechaGeneracion", String.class);

        addTitleBand(design, "$P{titulo}");
        addColumnHeaderBand(design, new String[]{"Fecha", "Tipo", "Categoría", "Concepto", "Monto", "Método Pago"});
        addDetailBand(design, new String[]{"fecha", "tipo", "categoria", "concepto", "monto", "metodoPago"});

        return design;
    }

    // ===== MÉTODOS AUXILIARES =====

    private void addField(JasperDesign design, String name, Class<?> type) throws JRException {
        JRDesignField field = new JRDesignField();
        field.setName(name);
        field.setValueClass(type);
        design.addField(field);
    }

    private void addParameter(JasperDesign design, String name, Class<?> type) throws JRException {
        JRDesignParameter parameter = new JRDesignParameter();
        parameter.setName(name);
        parameter.setValueClass(type);
        design.addParameter(parameter);
    }

    private void addTitleBand(JasperDesign design, String expression) throws JRException {
        JRDesignBand titleBand = new JRDesignBand();
        titleBand.setHeight(50);

        JRDesignTextField titleText = new JRDesignTextField();
        titleText.setX(0);
        titleText.setY(10);
        titleText.setWidth(535);
        titleText.setHeight(30);
        titleText.setHorizontalTextAlign(HorizontalTextAlignEnum.CENTER);
        titleText.setFontSize(16f);
        titleText.setBold(true);

        JRDesignExpression titleExpression = new JRDesignExpression();
        titleExpression.setText(expression);
        titleText.setExpression(titleExpression);

        titleBand.addElement(titleText);
        design.setTitle(titleBand);
    }

    private void addColumnHeaderBand(JasperDesign design, String[] headers) throws JRException {
        JRDesignBand columnHeaderBand = new JRDesignBand();
        columnHeaderBand.setHeight(20);

        int width = design.getColumnWidth() / headers.length;
        for (int i = 0; i < headers.length; i++) {
            JRDesignStaticText headerText = new JRDesignStaticText();
            headerText.setX(i * width);
            headerText.setY(0);
            headerText.setWidth(width);
            headerText.setHeight(20);
            headerText.setText(headers[i]);
            headerText.setBold(true);
            headerText.setFontSize(10f);
            columnHeaderBand.addElement(headerText);
        }

        design.setColumnHeader(columnHeaderBand);
    }

    private void addDetailBand(JasperDesign design, String[] fieldNames) throws JRException {
        JRDesignBand detailBand = new JRDesignBand();
        detailBand.setHeight(20);

        int width = design.getColumnWidth() / fieldNames.length;
        for (int i = 0; i < fieldNames.length; i++) {
            JRDesignTextField textField = new JRDesignTextField();
            textField.setX(i * width);
            textField.setY(0);
            textField.setWidth(width);
            textField.setHeight(20);
            textField.setFontSize(9f);

            JRDesignExpression expression = new JRDesignExpression();
            expression.setText("$F{" + fieldNames[i] + "}");
            textField.setExpression(expression);

            detailBand.addElement(textField);
        }

        ((JRDesignSection) design.getDetailSection()).addBand(detailBand);
    }

    private String getMesNombre(int mes) {
        String[] meses = {"Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"};
        return meses[mes - 1];
    }
}
