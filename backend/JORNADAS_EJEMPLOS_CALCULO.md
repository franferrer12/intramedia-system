# Ejemplos de Cálculo de Horas Trabajadas

## Algoritmo de Cálculo

El método `calcularHorasTrabajadas()` maneja dos casos:

### Caso 1: Turno Normal (no cruza medianoche)
Si `horaFin >= horaInicio`, el cálculo es directo:
```
horas = (horaFin - horaInicio)
```

### Caso 2: Turno Nocturno (cruza medianoche)
Si `horaFin < horaInicio`, el turno cruza la medianoche:
```
horas = (24:00 - horaInicio) + (horaFin - 00:00)
```

## Ejemplos Prácticos

### Ejemplo 1: Turno de Mañana
```
Entrada:
  horaInicio: 09:00:00
  horaFin:    17:00:00

Cálculo:
  17:00 >= 09:00 → Turno normal
  Segundos: 61200 - 32400 = 28800
  Horas: 28800 / 3600 = 8.00

Resultado: 8.00 horas
```

### Ejemplo 2: Turno Nocturno Corto
```
Entrada:
  horaInicio: 23:00:00
  horaFin:    03:00:00

Cálculo:
  03:00 < 23:00 → Turno cruza medianoche
  Segundos: (86400 - 82800) + 10800 = 3600 + 10800 = 14400
  Horas: 14400 / 3600 = 4.00

Resultado: 4.00 horas
```

### Ejemplo 3: Turno Nocturno Largo
```
Entrada:
  horaInicio: 22:00:00
  horaFin:    06:00:00

Cálculo:
  06:00 < 22:00 → Turno cruza medianoche
  Segundos: (86400 - 79200) + 21600 = 7200 + 21600 = 28800
  Horas: 28800 / 3600 = 8.00

Resultado: 8.00 horas
```

### Ejemplo 4: Turno con Minutos
```
Entrada:
  horaInicio: 09:30:00
  horaFin:    14:45:00

Cálculo:
  14:45 >= 09:30 → Turno normal
  Segundos inicio: (9 × 3600) + (30 × 60) = 34200
  Segundos fin: (14 × 3600) + (45 × 60) = 53100
  Diferencia: 53100 - 34200 = 18900
  Horas: 18900 / 3600 = 5.25

Resultado: 5.25 horas
```

### Ejemplo 5: Turno Nocturno con Minutos
```
Entrada:
  horaInicio: 23:30:00
  horaFin:    02:15:00

Cálculo:
  02:15 < 23:30 → Turno cruza medianoche
  Segundos inicio: (23 × 3600) + (30 × 60) = 84600
  Segundos fin: (2 × 3600) + (15 × 60) = 8100
  Segundos trabajados: (86400 - 84600) + 8100 = 1800 + 8100 = 9900
  Horas: 9900 / 3600 = 2.75

Resultado: 2.75 horas
```

### Ejemplo 6: Turno Completo 24h
```
Entrada:
  horaInicio: 00:00:00
  horaFin:    23:59:59

Cálculo:
  23:59:59 >= 00:00 → Turno normal
  Segundos: 86399 - 0 = 86399
  Horas: 86399 / 3600 = 23.99

Resultado: 23.99 horas
```

## Cálculo de Pago

Una vez calculadas las horas, el pago se calcula:

```
totalPago = horasTrabajadas × precioHora
```

### Ejemplo de Pago 1
```
Jornada:
  horaInicio: 23:00
  horaFin: 03:00
  precioHora: 15.00€

Cálculo:
  Horas: 4.00
  Pago: 4.00 × 15.00 = 60.00€
```

### Ejemplo de Pago 2
```
Jornada:
  horaInicio: 09:30
  horaFin: 14:45
  precioHora: 12.50€

Cálculo:
  Horas: 5.25
  Pago: 5.25 × 12.50 = 65.63€
```

### Ejemplo de Pago 3 (Precio por defecto)
```
Empleado:
  salarioBase: 1600.00€

Jornada:
  horaInicio: 22:00
  horaFin: 06:00
  precioHora: NO ESPECIFICADO

Cálculo:
  precioHora = salarioBase / 160 = 1600 / 160 = 10.00€
  Horas: 8.00
  Pago: 8.00 × 10.00 = 80.00€
```

## Tabla de Conversión Rápida

| Hora Inicio | Hora Fin | Cruza Medianoche | Horas | Notas |
|-------------|----------|------------------|-------|-------|
| 09:00 | 17:00 | No | 8.00 | Turno estándar mañana |
| 14:00 | 22:00 | No | 8.00 | Turno estándar tarde |
| 22:00 | 06:00 | Sí | 8.00 | Turno nocturno completo |
| 23:00 | 03:00 | Sí | 4.00 | Media noche |
| 00:00 | 08:00 | No | 8.00 | Inicio medianoche |
| 20:00 | 04:00 | Sí | 8.00 | Tarde-noche |
| 18:00 | 02:00 | Sí | 8.00 | Noche discoteca |
| 09:30 | 14:30 | No | 5.00 | Medio turno |
| 23:30 | 02:30 | Sí | 3.00 | Turno corto nocturno |

## Casos Especiales

### Turno de 1 minuto
```
horaInicio: 09:00:00
horaFin:    09:01:00
Resultado: 0.02 horas (redondeado)
```

### Turno que termina justo en medianoche
```
horaInicio: 20:00:00
horaFin:    00:00:00
Cálculo: 00:00 < 20:00 → Cruza medianoche
Resultado: 4.00 horas
```

### Turno que empieza en medianoche
```
horaInicio: 00:00:00
horaFin:    08:00:00
Cálculo: 08:00 >= 00:00 → Turno normal
Resultado: 8.00 horas
```

## Precisión y Redondeo

- **Precisión**: 2 decimales
- **Método de redondeo**: `HALF_UP`
  - 5.125 → 5.13
  - 5.124 → 5.12
  - 5.115 → 5.12
  - 5.125 → 5.13

## Validaciones Recomendadas

Aunque no están implementadas en el servicio actual, se podrían añadir:

1. **Límite máximo de horas**: Validar que no se exceda (ej: 24 horas)
2. **Hora mínima**: Validar que el turno sea de al menos X minutos
3. **Solapamiento**: Verificar que no haya jornadas solapadas del mismo empleado
4. **Fecha futura**: Validar que la fecha no sea muy futura

## Código Java del Algoritmo

```java
private BigDecimal calcularHorasTrabajadas(LocalTime horaInicio, LocalTime horaFin) {
    long segundosInicio = horaInicio.toSecondOfDay();
    long segundosFin = horaFin.toSecondOfDay();

    long segundosTrabajados;
    if (segundosFin >= segundosInicio) {
        // Turno normal (no cruza medianoche)
        segundosTrabajados = segundosFin - segundosInicio;
    } else {
        // Turno que cruza medianoche
        // Calculamos: (24:00 - horaInicio) + (horaFin - 00:00)
        segundosTrabajados = (86400 - segundosInicio) + segundosFin;
    }

    // Convertir segundos a horas con 2 decimales
    BigDecimal horas = new BigDecimal(segundosTrabajados)
            .divide(new BigDecimal("3600"), 2, RoundingMode.HALF_UP);

    return horas;
}
```

## Constantes Importantes

```java
// Segundos en un día
private static final long SEGUNDOS_DIA = 86400;

// Segundos en una hora
private static final long SEGUNDOS_HORA = 3600;

// Horas mensuales estándar (para cálculo de precio/hora)
private static final BigDecimal HORAS_MENSUALES = new BigDecimal("160");
```
