package com.club.management.service;

import com.club.management.entity.Producto.TipoVenta;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

/**
 * Servicio para cálculos económicos de productos de ocio nocturno
 * Calcula unidades teóricas, reales, ingresos y márgenes
 */
@Service
public class ProductoCalculationService {

    /**
     * Calcular todas las métricas económicas de un producto
     *
     * @param precioCompra Precio de compra de la botella
     * @param precioVenta Precio de venta por servicio (copa/chupito) o botella
     * @param capacidadMl Capacidad de la botella en ml
     * @param tipoVenta Tipo de venta (COPA, CHUPITO, BOTELLA)
     * @param mlPorServicio ML por servicio (opcional, usa presets si es null)
     * @param factorMerma Factor de merma % (opcional, usa presets si es null)
     * @return Map con todos los valores calculados
     */
    public Map<String, Object> calcularMetricas(
            BigDecimal precioCompra,
            BigDecimal precioVenta,
            BigDecimal capacidadMl,
            TipoVenta tipoVenta,
            BigDecimal mlPorServicio,
            BigDecimal factorMerma
    ) {
        Map<String, Object> resultado = new HashMap<>();

        // Valores de entrada
        resultado.put("precioCompra", precioCompra);
        resultado.put("precioVenta", precioVenta);
        resultado.put("capacidadMl", capacidadMl);
        resultado.put("tipoVenta", tipoVenta.name());

        // Aplicar presets si no se proporcionan valores
        if (mlPorServicio == null) {
            mlPorServicio = getPresetMlPorServicio(tipoVenta);
        }
        if (factorMerma == null) {
            factorMerma = getPresetFactorMerma(tipoVenta);
        }

        resultado.put("mlPorServicio", mlPorServicio);
        resultado.put("factorMerma", factorMerma);

        // Calcular según tipo de venta
        BigDecimal unidadesTeorica, unidadesReales, ingresoTotal, beneficio, margen;

        if (tipoVenta == TipoVenta.BOTELLA) {
            // Botella completa: 1 unidad = 1 botella
            unidadesTeorica = BigDecimal.ONE;
            unidadesReales = BigDecimal.ONE;
            ingresoTotal = precioVenta;

        } else {
            // COPA o CHUPITO: calcular servicios por botella
            if (mlPorServicio.compareTo(BigDecimal.ZERO) == 0) {
                throw new IllegalArgumentException("ml_por_servicio no puede ser 0 para tipo " + tipoVenta);
            }

            // Unidades teóricas = capacidad_ml / ml_por_servicio
            unidadesTeorica = capacidadMl.divide(mlPorServicio, 2, RoundingMode.HALF_UP);

            // Unidades reales = teóricas × (1 - merma/100)
            BigDecimal factorReal = BigDecimal.ONE.subtract(
                    factorMerma.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
            );
            unidadesReales = unidadesTeorica.multiply(factorReal).setScale(2, RoundingMode.HALF_UP);

            // Ingreso total = precio_venta × unidades_reales
            ingresoTotal = precioVenta.multiply(unidadesReales).setScale(2, RoundingMode.HALF_UP);
        }

        // Beneficio = ingreso_total - precio_compra
        beneficio = ingresoTotal.subtract(precioCompra).setScale(2, RoundingMode.HALF_UP);

        // Margen % = (beneficio / precio_compra) × 100
        if (precioCompra.compareTo(BigDecimal.ZERO) > 0) {
            margen = beneficio.divide(precioCompra, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        } else {
            margen = BigDecimal.ZERO;
        }

        // Añadir resultados
        resultado.put("unidadesTeorica", unidadesTeorica);
        resultado.put("unidadesReales", unidadesReales);
        resultado.put("ingresoTotalEstimado", ingresoTotal);
        resultado.put("beneficioUnitario", beneficio);
        resultado.put("margenPorcentaje", margen);

        // Añadir métricas adicionales útiles
        BigDecimal precioPorServicio = unidadesReales.compareTo(BigDecimal.ZERO) > 0
                ? ingresoTotal.divide(unidadesReales, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        resultado.put("precioPromedioServicio", precioPorServicio);

        return resultado;
    }

    /**
     * Obtener ML por servicio según preset del tipo de venta
     */
    public BigDecimal getPresetMlPorServicio(TipoVenta tipoVenta) {
        return switch (tipoVenta) {
            case COPA -> BigDecimal.valueOf(90);      // 6 segundos
            case CHUPITO -> BigDecimal.valueOf(30);   // 2 segundos
            case BOTELLA -> null;                     // No aplica
        };
    }

    /**
     * Obtener factor de merma según preset del tipo de venta
     */
    public BigDecimal getPresetFactorMerma(TipoVenta tipoVenta) {
        return switch (tipoVenta) {
            case COPA -> BigDecimal.valueOf(10);      // 10% merma
            case CHUPITO -> BigDecimal.valueOf(5);    // 5% merma
            case BOTELLA -> BigDecimal.ZERO;          // 0% merma
        };
    }

    /**
     * Obtener capacidades comunes según tipo de venta
     */
    public int[] getCapacidadesComunes(TipoVenta tipoVenta) {
        return switch (tipoVenta) {
            case COPA -> new int[]{700, 1000, 1500};
            case CHUPITO -> new int[]{700, 1000};
            case BOTELLA -> new int[]{700, 750, 1000, 1500, 3000};
        };
    }

    /**
     * Obtener todos los presets para un tipo de venta
     */
    public Map<String, Object> getPresets(TipoVenta tipoVenta) {
        Map<String, Object> presets = new HashMap<>();
        presets.put("tipoVenta", tipoVenta.name());
        presets.put("mlPorServicio", getPresetMlPorServicio(tipoVenta));
        presets.put("factorMerma", getPresetFactorMerma(tipoVenta));
        presets.put("capacidadesComunes", getCapacidadesComunes(tipoVenta));

        // Descripciones
        String descripcion = switch (tipoVenta) {
            case COPA -> "Bebidas largas (gin-tonic, cubata) - 6 seg ≈ 90ml";
            case CHUPITO -> "Shots individuales - 2 seg ≈ 30ml";
            case BOTELLA -> "Botella completa para reservados VIP";
        };
        presets.put("descripcion", descripcion);

        return presets;
    }

    /**
     * Calcular servicios disponibles en stock
     *
     * @param stockBotellas Stock actual en botellas
     * @param unidadesReales Servicios reales por botella
     * @param tipoVenta Tipo de venta
     * @return Total de servicios disponibles
     */
    public BigDecimal calcularServiciosDisponibles(
            BigDecimal stockBotellas,
            BigDecimal unidadesReales,
            TipoVenta tipoVenta
    ) {
        if (tipoVenta == TipoVenta.BOTELLA || unidadesReales == null) {
            return stockBotellas;
        }
        return stockBotellas.multiply(unidadesReales).setScale(0, RoundingMode.DOWN);
    }

    /**
     * Calcular ingreso potencial del stock actual
     *
     * @param stockBotellas Stock actual en botellas
     * @param precioVenta Precio de venta por servicio
     * @param unidadesReales Servicios reales por botella
     * @param tipoVenta Tipo de venta
     * @return Ingreso potencial total
     */
    public BigDecimal calcularIngresoPotencialStock(
            BigDecimal stockBotellas,
            BigDecimal precioVenta,
            BigDecimal unidadesReales,
            TipoVenta tipoVenta
    ) {
        BigDecimal servicios = calcularServiciosDisponibles(stockBotellas, unidadesReales, tipoVenta);
        return servicios.multiply(precioVenta).setScale(2, RoundingMode.HALF_UP);
    }
}
