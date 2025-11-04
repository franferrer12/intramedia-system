import MonthlyExpense from '../models/MonthlyExpense.js';

// GET /api/monthly-expenses - Obtener todos los registros mensuales
export const getAll = async (req, res) => {
  try {
    const { año, cerrado } = req.query;

    const filters = {};
    if (año) filters.año = parseInt(año);
    if (cerrado !== undefined) filters.cerrado = cerrado === 'true';

    const expenses = await MonthlyExpense.findAll(filters);

    res.json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    console.error('Error al obtener gastos mensuales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener gastos mensuales',
      error: error.message
    });
  }
};

// GET /api/monthly-expenses/:year/:month - Obtener registro de un mes específico
export const getByPeriod = async (req, res) => {
  try {
    const { year, month } = req.params;
    const año = parseInt(year);
    const mes = parseInt(month);

    // Validaciones básicas
    if (isNaN(año) || isNaN(mes)) {
      return res.status(400).json({
        success: false,
        message: 'Año y mes deben ser números válidos'
      });
    }

    if (mes < 1 || mes > 12) {
      return res.status(400).json({
        success: false,
        message: 'El mes debe estar entre 1 y 12'
      });
    }

    const expense = await MonthlyExpense.findByPeriod(año, mes);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró registro para este periodo'
      });
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Error al obtener gasto mensual:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener gasto mensual',
      error: error.message
    });
  }
};

// POST /api/monthly-expenses - Crear registro mensual
export const create = async (req, res) => {
  try {
    const { año, mes } = req.body;

    // Validaciones básicas
    if (!año || !mes) {
      return res.status(400).json({
        success: false,
        message: 'Año y mes son requeridos'
      });
    }

    if (mes < 1 || mes > 12) {
      return res.status(400).json({
        success: false,
        message: 'El mes debe estar entre 1 y 12'
      });
    }

    // Verificar si ya existe
    const existing = await MonthlyExpense.findByPeriod(año, mes);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un registro para este periodo. Use PUT para actualizar.'
      });
    }

    const expense = await MonthlyExpense.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Registro mensual creado exitosamente',
      data: expense
    });
  } catch (error) {
    console.error('Error al crear gasto mensual:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear gasto mensual',
      error: error.message
    });
  }
};

// PUT /api/monthly-expenses/:year/:month - Actualizar gastos reales
export const update = async (req, res) => {
  try {
    const { year, month } = req.params;
    const año = parseInt(year);
    const mes = parseInt(month);

    // Validaciones básicas
    if (isNaN(año) || isNaN(mes)) {
      return res.status(400).json({
        success: false,
        message: 'Año y mes deben ser números válidos'
      });
    }

    if (mes < 1 || mes > 12) {
      return res.status(400).json({
        success: false,
        message: 'El mes debe estar entre 1 y 12'
      });
    }

    // Verificar si existe
    const existing = await MonthlyExpense.findByPeriod(año, mes);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró registro para este periodo'
      });
    }

    // Verificar si está cerrado
    if (existing.cerrado) {
      return res.status(403).json({
        success: false,
        message: 'No se puede modificar un periodo cerrado'
      });
    }

    const expense = await MonthlyExpense.update(año, mes, req.body);

    res.json({
      success: true,
      message: 'Registro mensual actualizado exitosamente',
      data: expense
    });
  } catch (error) {
    console.error('Error al actualizar gasto mensual:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar gasto mensual',
      error: error.message
    });
  }
};

// POST /api/monthly-expenses/:year/:month/calculate-budget - Calcular presupuesto del mes
export const calculateBudget = async (req, res) => {
  try {
    const { year, month } = req.params;
    const año = parseInt(year);
    const mes = parseInt(month);

    // Validaciones básicas
    if (isNaN(año) || isNaN(mes)) {
      return res.status(400).json({
        success: false,
        message: 'Año y mes deben ser números válidos'
      });
    }

    if (mes < 1 || mes > 12) {
      return res.status(400).json({
        success: false,
        message: 'El mes debe estar entre 1 y 12'
      });
    }

    const expense = await MonthlyExpense.calculateBudget(año, mes);

    res.json({
      success: true,
      message: 'Presupuesto calculado exitosamente',
      data: expense
    });
  } catch (error) {
    console.error('Error al calcular presupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular presupuesto',
      error: error.message
    });
  }
};

// POST /api/monthly-expenses/:year/:month/redistribute - Redistribuir excedente
export const redistribute = async (req, res) => {
  try {
    const { year, month } = req.params;
    const año = parseInt(year);
    const mes = parseInt(month);

    // Validaciones básicas
    if (isNaN(año) || isNaN(mes)) {
      return res.status(400).json({
        success: false,
        message: 'Año y mes deben ser números válidos'
      });
    }

    if (mes < 1 || mes > 12) {
      return res.status(400).json({
        success: false,
        message: 'El mes debe estar entre 1 y 12'
      });
    }

    // Verificar si existe
    const existing = await MonthlyExpense.findByPeriod(año, mes);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró registro para este periodo'
      });
    }

    // Verificar si está cerrado
    if (existing.cerrado) {
      return res.status(403).json({
        success: false,
        message: 'No se puede redistribuir un periodo cerrado'
      });
    }

    const expense = await MonthlyExpense.redistribute(año, mes);

    res.json({
      success: true,
      message: 'Excedente redistribuido exitosamente',
      data: expense
    });
  } catch (error) {
    console.error('Error al redistribuir excedente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al redistribuir excedente',
      error: error.message
    });
  }
};

// POST /api/monthly-expenses/:year/:month/close - Cerrar mes
export const closePeriod = async (req, res) => {
  try {
    const { year, month } = req.params;
    const año = parseInt(year);
    const mes = parseInt(month);

    // Validaciones básicas
    if (isNaN(año) || isNaN(mes)) {
      return res.status(400).json({
        success: false,
        message: 'Año y mes deben ser números válidos'
      });
    }

    if (mes < 1 || mes > 12) {
      return res.status(400).json({
        success: false,
        message: 'El mes debe estar entre 1 y 12'
      });
    }

    // Verificar si existe
    const existing = await MonthlyExpense.findByPeriod(año, mes);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró registro para este periodo'
      });
    }

    // Verificar si ya está cerrado
    if (existing.cerrado) {
      return res.status(409).json({
        success: false,
        message: 'El periodo ya está cerrado'
      });
    }

    const expense = await MonthlyExpense.closePeriod(año, mes);

    res.json({
      success: true,
      message: 'Periodo cerrado exitosamente',
      data: expense
    });
  } catch (error) {
    console.error('Error al cerrar periodo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar periodo',
      error: error.message
    });
  }
};

// GET /api/monthly-expenses/budget-vs-real - Comparativa presupuesto vs real
export const getBudgetVsReal = async (req, res) => {
  try {
    const { año, mes, cerrado } = req.query;

    const filters = {};
    if (año) filters.año = parseInt(año);
    if (mes) filters.mes = parseInt(mes);
    if (cerrado !== undefined) filters.cerrado = cerrado === 'true';

    const comparison = await MonthlyExpense.getBudgetVsReal(filters);

    res.json({
      success: true,
      count: comparison.length,
      data: comparison
    });
  } catch (error) {
    console.error('Error al obtener comparativa presupuesto vs real:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comparativa presupuesto vs real',
      error: error.message
    });
  }
};
