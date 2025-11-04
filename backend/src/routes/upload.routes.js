import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Multer para upload de fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/djs');

    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: dj-{id}-{timestamp}.{ext}
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `dj-${req.params.id || 'new'}-${uniqueSuffix}${ext}`);
  }
});

// Filtro para solo aceptar imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: fileFilter
});

/**
 * @route   POST /api/upload/dj/:id/photo
 * @desc    Subir foto de perfil para un DJ
 * @access  Public
 */
router.post('/dj/:id/photo', upload.single('photo'), async (req, file) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió ningún archivo'
      });
    }

    // URL de la foto subida
    const photoUrl = `/uploads/djs/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: 'Foto subida exitosamente',
      data: {
        filename: req.file.filename,
        path: photoUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Error subiendo foto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al subir la foto',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/upload/dj/:filename
 * @desc    Eliminar foto de DJ
 * @access  Public
 */
router.delete('/dj/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/djs', filename);

    // Verificar si el archivo existe
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.status(200).json({
        success: true,
        message: 'Foto eliminada exitosamente'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }
  } catch (error) {
    console.error('Error eliminando foto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar la foto',
      error: error.message
    });
  }
});

export default router;
