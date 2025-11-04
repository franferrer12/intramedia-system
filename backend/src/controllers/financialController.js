import Transaction from '../models/Transaction.js';

/**
 * Controlador para gestión financiera
 */

// Obtener resumen financiero de la agencia
export const getAgencySummary = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const summary = await Transaction.getAgencySummary(agencyId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error al obtener resumen financiero:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen financiero'
    });
  }
};

// Obtener todas las transacciones
export const getAllTransactions = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const filters = {
      dj_id: req.query.dj_id,
      tipo: req.query.tipo,
      estado: req.query.estado,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta
    };

    const transactions = await Transaction.findByAgency(agencyId, filters);

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener transacciones'
    });
  }
};

// Obtener una transacción por ID
export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error al obtener transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener transacción'
    });
  }
};

// Crear nueva transacción
export const createTransaction = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const transactionData = {
      ...req.body,
      agency_id: agencyId,
      creado_por: req.user.id
    };

    const transaction = await Transaction.create(transactionData);

    res.status(201).json({
      success: true,
      message: 'Transacción creada exitosamente',
      data: transaction
    });
  } catch (error) {
    console.error('Error al crear transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear transacción',
      error: error.message
    });
  }
};

// Registrar pago de cliente
export const registerClientPayment = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const paymentData = {
      ...req.body,
      agency_id: agencyId,
      creado_por: req.user.id
    };

    const transaction = await Transaction.registerClientPayment(paymentData);

    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: transaction
    });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar pago',
      error: error.message
    });
  }
};

// Marcar transacción como pagada
export const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { metodo_pago, fecha_pago, notas_internas } = req.body;

    const transaction = await Transaction.markAsPaid(id, {
      metodo_pago,
      fecha_pago,
      notas_internas
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Transacción marcada como pagada',
      data: transaction
    });
  } catch (error) {
    console.error('Error al marcar como pagada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar transacción'
    });
  }
};

// Actualizar transacción
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.update(id, req.body);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Transacción actualizada',
      data: transaction
    });
  } catch (error) {
    console.error('Error al actualizar transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar transacción'
    });
  }
};

// Cancelar transacción
export const cancelTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.cancel(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Transacción cancelada',
      data: transaction
    });
  } catch (error) {
    console.error('Error al cancelar transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar transacción'
    });
  }
};

// Obtener balance de un DJ
export const getDJBalance = async (req, res) => {
  try {
    const { dj_id } = req.params;
    const balance = await Transaction.getDJBalance(dj_id);

    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    console.error('Error al obtener balance del DJ:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener balance'
    });
  }
};

// Obtener balances de todos los DJs
export const getAllDJBalances = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const balances = await Transaction.getAllDJBalances(agencyId);

    res.json({
      success: true,
      data: balances
    });
  } catch (error) {
    console.error('Error al obtener balances:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener balances'
    });
  }
};
