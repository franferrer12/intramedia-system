import { useState, useRef } from 'react';
import { Upload, X, Camera, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PhotoUpload = ({ currentPhoto, djId, djName, onPhotoUpdate }) => {
  const [preview, setPreview] = useState(currentPhoto);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no puede ser mayor a 5MB');
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result);
    reader.readAsDataURL(file);

    // Subir archivo
    await uploadPhoto(file);
  };

  const uploadPhoto = async (file) => {
    const formData = new FormData();
    formData.append('photo', file);

    setUploading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/upload/dj/${djId}/photo`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      if (response.data.success) {
        const photoUrl = `${API_URL}${response.data.data.path}`;
        setPreview(photoUrl);
        toast.success('Foto subida exitosamente');

        // Actualizar DJ con nueva foto
        if (onPhotoUpdate) {
          await onPhotoUpdate(photoUrl);
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Error al subir la foto');
      setPreview(currentPhoto); // Revertir preview
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('¿Eliminar la foto?')) return;

    setPreview(null);
    if (onPhotoUpdate) {
      await onPhotoUpdate(null);
    }
    toast.success('Foto eliminada');
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Preview de la foto */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
          {preview ? (
            <img
              src={preview}
              alt={djName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
              <Camera className="w-12 h-12 text-white opacity-50" />
            </div>
          )}
        </div>

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Loader className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Botón de eliminar foto */}
        {preview && !uploading && (
          <button
            onClick={handleRemovePhoto}
            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn btn-primary flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {preview ? 'Cambiar Foto' : 'Subir Foto'}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Formatos: JPG, PNG, GIF, WEBP<br />
        Tamaño máximo: 5MB
      </p>
    </div>
  );
};

export default PhotoUpload;
