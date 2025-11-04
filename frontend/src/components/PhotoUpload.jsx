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
    <div className="flex items-center gap-3">
      {/* Preview de la foto */}
      <div className="relative group">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 dark:border-gray-600 shadow">
          {preview ? (
            <img
              src={preview}
              alt={djName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
              <Camera className="w-6 h-6 text-white opacity-70" />
            </div>
          )}
        </div>

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Loader className="w-5 h-5 text-white animate-spin" />
          </div>
        )}

        {/* Botón de eliminar foto (aparece al hacer hover) */}
        {preview && !uploading && (
          <button
            onClick={handleRemovePhoto}
            className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 shadow-md"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Indicador de cambio de foto al hacer hover */}
        {!uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all cursor-pointer"
               onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Botón compacto */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-1.5"
        title="Formatos: JPG, PNG, GIF, WEBP | Max: 5MB"
      >
        <Upload className="w-3.5 h-3.5" />
        {preview ? 'Cambiar' : 'Subir'}
      </button>
    </div>
  );
};

export default PhotoUpload;
