import { query } from '../config/database.js';

class ProfitDistribution {
  // Obtener configuración activa
  static async getConfig() {
    const sql = `
      SELECT *
      FROM profit_distribution_config
      WHERE activo = true
      ORDER BY fecha_actualizacion DESC
      LIMIT 1
    `;

    const result = await query(sql);
    return result.rows[0];
  }

  // Actualizar configuración
  static async update(configData) {
    const {
      porcentaje_gastos_fijos,
      porcentaje_inversion,
      porcentaje_socios,
      porcentaje_fran,
      porcentaje_roberto,
      porcentaje_pablo,
      descripcion_gastos_fijos,
      descripcion_inversion,
      descripcion_socios,
      actualizado_por
    } = configData;

    // Validar que los porcentajes principales sumen 100%
    const totalPrincipal = parseFloat(porcentaje_gastos_fijos || 0) +
                          parseFloat(porcentaje_inversion || 0) +
                          parseFloat(porcentaje_socios || 0);

    if (Math.abs(totalPrincipal - 100) > 0.01) {
      throw new Error(`Los porcentajes deben sumar 100%. Total actual: ${totalPrincipal.toFixed(2)}%`);
    }

    // Validar que los porcentajes de socios sumen 100%
    const totalSocios = parseFloat(porcentaje_fran || 0) +
                       parseFloat(porcentaje_roberto || 0) +
                       parseFloat(porcentaje_pablo || 0);

    if (Math.abs(totalSocios - 100) > 0.01) {
      throw new Error(`Los porcentajes de socios deben sumar 100%. Total actual: ${totalSocios.toFixed(2)}%`);
    }

    // Validar que todos los porcentajes sean positivos
    const allPercentages = [
      porcentaje_gastos_fijos,
      porcentaje_inversion,
      porcentaje_socios,
      porcentaje_fran,
      porcentaje_roberto,
      porcentaje_pablo
    ];

    if (allPercentages.some(p => p < 0)) {
      throw new Error('Los porcentajes no pueden ser negativos');
    }

    // Actualizar la configuración existente (solo hay una fila)
    const sql = `
      UPDATE profit_distribution_config SET
        porcentaje_gastos_fijos = $1,
        porcentaje_inversion = $2,
        porcentaje_socios = $3,
        porcentaje_fran = $4,
        porcentaje_roberto = $5,
        porcentaje_pablo = $6,
        descripcion_gastos_fijos = COALESCE($7, descripcion_gastos_fijos),
        descripcion_inversion = COALESCE($8, descripcion_inversion),
        descripcion_socios = COALESCE($9, descripcion_socios),
        actualizado_por = $10,
        fecha_actualizacion = NOW()
      WHERE activo = true
      RETURNING *
    `;

    const values = [
      porcentaje_gastos_fijos,
      porcentaje_inversion,
      porcentaje_socios,
      porcentaje_fran,
      porcentaje_roberto,
      porcentaje_pablo,
      descripcion_gastos_fijos,
      descripcion_inversion,
      descripcion_socios,
      actualizado_por
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Recalcular distribución de todos los eventos
  static async recalculateAllEvents() {
    const sql = 'SELECT recalcular_distribucion_todos_eventos() as eventos_procesados';
    const result = await query(sql);

    // Obtener estadísticas después del recálculo
    const statsSql = `
      SELECT
        COUNT(*) as eventos_procesados,
        SUM(beneficio_bruto) as beneficio_total,
        SUM(monto_gastos_fijos) as total_gastos_fijos,
        SUM(monto_inversion) as total_inversion,
        SUM(monto_socios) as total_socios,
        SUM(monto_fran) as total_fran,
        SUM(monto_roberto) as total_roberto,
        SUM(monto_pablo) as total_pablo
      FROM events
      WHERE beneficio_bruto > 0
    `;

    const statsResult = await query(statsSql);
    return {
      ...statsResult.rows[0],
      recalculados: result.rows[0].eventos_procesados
    };
  }
}

export default ProfitDistribution;
