import { query } from '../config/database.js';

// Obtener todos los socios
export const getSocios = async (req, res) => {
  try {
    const socios = await query('SELECT * FROM socios ORDER BY nombre');

    res.json({
      success: true,
      data: socios.rows
    });
  } catch (error) {
    console.error('Error al obtener socios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener socios',
      error: error.message
    });
  }
};

// Obtener reporte de ingresos por socio
export const getReporteIngresosSocios = async (req, res) => {
  try {
    const { year, socio_id } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    let sql = `
      SELECT
        socio_id,
        socio,
        porcentaje_participacion,
        año,
        mes,
        eventos,
        comision_total,
        ingreso_socio
      FROM reporte_ingresos_socios
      WHERE año = $1
    `;

    const params = [currentYear];

    if (socio_id) {
      sql += ` AND socio_id = $2`;
      params.push(parseInt(socio_id));
    }

    sql += ` ORDER BY mes DESC, socio`;

    const reporte = await query(sql, params);

    // Calcular totales
    const totales = await query(`
      SELECT
        socio_id,
        socio,
        porcentaje_participacion,
        SUM(eventos) as total_eventos,
        SUM(comision_total) as total_comision,
        SUM(ingreso_socio) as total_ingreso
      FROM reporte_ingresos_socios
      WHERE año = $1 ${socio_id ? 'AND socio_id = $2' : ''}
      GROUP BY socio_id, socio, porcentaje_participacion
      ORDER BY socio
    `, socio_id ? [currentYear, parseInt(socio_id)] : [currentYear]);

    res.json({
      success: true,
      data: {
        year: currentYear,
        reporte_mensual: reporte.rows,
        totales_anuales: totales.rows
      }
    });
  } catch (error) {
    console.error('Error al obtener reporte de socios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reporte de socios',
      error: error.message
    });
  }
};

// Dashboard financiero de socios
export const getDashboardSocios = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Ingresos por socio del año actual
    const ingresosSocios = await query(`
      SELECT
        s.id,
        s.nombre,
        s.porcentaje_participacion,
        SUM(e.parte_agencia) as comision_total_año,
        SUM(e.parte_agencia) * (s.porcentaje_participacion / 100) as ingreso_total_año,
        COUNT(e.id) as eventos_año
      FROM socios s
      CROSS JOIN eventos e
      WHERE s.activo = true AND EXTRACT(YEAR FROM e.fecha) = $1
      GROUP BY s.id, s.nombre, s.porcentaje_participacion
      ORDER BY s.nombre
    `, [currentYear]);

    // Ingresos del mes actual
    const ingresosMesActual = await query(`
      SELECT
        s.id,
        s.nombre,
        SUM(e.parte_agencia) * (s.porcentaje_participacion / 100) as ingreso_mes
      FROM socios s
      CROSS JOIN eventos e
      WHERE s.activo = true
        AND EXTRACT(YEAR FROM e.fecha) = $1
        AND EXTRACT(MONTH FROM e.fecha) = $2
      GROUP BY s.id, s.nombre, s.porcentaje_participacion
    `, [currentYear, currentMonth]);

    // Evolución mensual
    const evolucionMensual = await query(`
      SELECT
        TO_CHAR(e.fecha, 'YYYY-MM') as mes,
        COUNT(e.id) as eventos,
        SUM(e.parte_agencia) as comision_total
      FROM eventos e
      WHERE EXTRACT(YEAR FROM e.fecha) = $1
      GROUP BY TO_CHAR(e.fecha, 'YYYY-MM')
      ORDER BY mes
    `, [currentYear]);

    res.json({
      success: true,
      data: {
        year: currentYear,
        socios: ingresosSocios.rows,
        ingresos_mes_actual: ingresosMesActual.rows,
        evolucion_mensual: evolucionMensual.rows
      }
    });
  } catch (error) {
    console.error('Error al obtener dashboard de socios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener dashboard de socios',
      error: error.message
    });
  }
};

// Actualizar socio
export const updateSocio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, porcentaje_participacion, activo, observaciones } = req.body;

    const result = await query(`
      UPDATE socios
      SET
        nombre = COALESCE($1, nombre),
        email = COALESCE($2, email),
        telefono = COALESCE($3, telefono),
        porcentaje_participacion = COALESCE($4, porcentaje_participacion),
        activo = COALESCE($5, activo),
        observaciones = COALESCE($6, observaciones),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [nombre, email, telefono, porcentaje_participacion, activo, observaciones, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Socio no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Socio actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar socio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar socio',
      error: error.message
    });
  }
};

export default {
  getSocios,
  getReporteIngresosSocios,
  getDashboardSocios,
  updateSocio
};
