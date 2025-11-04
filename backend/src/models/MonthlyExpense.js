import { query } from '../config/database.js';

class MonthlyExpense {
  // Obtener todos los registros mensuales con filtros opcionales
  static async findAll(filters = {}) {
    let sql = `
      SELECT * FROM monthly_expenses
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    // Filtros dinámicos
    if (filters.año) {
      sql += ` AND año = $${paramIndex}`;
      values.push(filters.año);
      paramIndex++;
    }

    if (filters.cerrado !== undefined) {
      sql += ` AND cerrado = $${paramIndex}`;
      values.push(filters.cerrado);
      paramIndex++;
    }

    sql += ` ORDER BY año DESC, mes DESC`;

    const result = await query(sql, values);
    return result.rows;
  }

  // Obtener registro de un mes específico
  static async findByPeriod(año, mes) {
    const sql = `
      SELECT * FROM monthly_expenses
      WHERE año = $1 AND mes = $2
    `;

    const result = await query(sql, [año, mes]);
    return result.rows[0];
  }

  // Crear registro mensual
  static async create(expenseData) {
    const {
      año,
      mes,
      mes_nombre,
      gastos_fijos_reales,
      inversion_real,
      desglose_gastos,
      notas,
      registrado_por
    } = expenseData;

    const sql = `
      INSERT INTO monthly_expenses (
        año, mes, mes_nombre,
        gastos_fijos_reales, inversion_real,
        desglose_gastos, notas, registrado_por
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      año,
      mes,
      mes_nombre || null,
      gastos_fijos_reales || 0,
      inversion_real || 0,
      desglose_gastos ? JSON.stringify(desglose_gastos) : '[]',
      notas || null,
      registrado_por || null
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Actualizar gastos reales
  static async update(año, mes, expenseData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Construcción dinámica del UPDATE
    const allowedFields = [
      'gastos_fijos_reales',
      'inversion_real',
      'desglose_gastos',
      'notas',
      'mes_nombre'
    ];

    Object.keys(expenseData).forEach(key => {
      if (allowedFields.includes(key) && expenseData[key] !== undefined) {
        // Para JSONB, necesitamos convertir a string
        if (key === 'desglose_gastos') {
          fields.push(`${key} = $${paramIndex}::jsonb`);
          values.push(JSON.stringify(expenseData[key]));
        } else {
          fields.push(`${key} = $${paramIndex}`);
          values.push(expenseData[key]);
        }
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    values.push(año, mes);
    const sql = `
      UPDATE monthly_expenses
      SET ${fields.join(', ')}
      WHERE año = $${paramIndex} AND mes = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Llamar a función para calcular presupuesto del mes
  static async calculateBudget(año, mes) {
    const sql = `SELECT calcular_presupuesto_mes($1, $2)`;
    await query(sql, [año, mes]);

    // Retornar el registro actualizado
    return await this.findByPeriod(año, mes);
  }

  // Llamar a función para redistribuir excedente
  static async redistribute(año, mes) {
    const sql = `SELECT redistribuir_excedente($1, $2)`;
    await query(sql, [año, mes]);

    // Retornar el registro actualizado
    return await this.findByPeriod(año, mes);
  }

  // Llamar a función para cerrar mes
  static async closePeriod(año, mes) {
    const sql = `SELECT cerrar_mes($1, $2)`;
    await query(sql, [año, mes]);

    // Retornar el registro actualizado
    return await this.findByPeriod(año, mes);
  }

  // Consultar vista de presupuesto vs real
  static async getBudgetVsReal(filters = {}) {
    let sql = `
      SELECT * FROM vw_budget_vs_real
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    // Filtros dinámicos
    if (filters.año) {
      sql += ` AND año = $${paramIndex}`;
      values.push(filters.año);
      paramIndex++;
    }

    if (filters.mes) {
      sql += ` AND mes = $${paramIndex}`;
      values.push(filters.mes);
      paramIndex++;
    }

    if (filters.cerrado !== undefined) {
      sql += ` AND cerrado = $${paramIndex}`;
      values.push(filters.cerrado);
      paramIndex++;
    }

    sql += ` ORDER BY año DESC, mes DESC`;

    const result = await query(sql, values);
    return result.rows;
  }
}

export default MonthlyExpense;
