import { useState, useEffect, useCallback } from 'react';
import {
  Upload, FileText, Image, Film, Music, Archive,
  File, Download, Share2, Clock, Trash2, Eye,
  Search, Filter, Grid, List, Plus, X, Tag,
  ChevronDown, ExternalLink, Link as LinkIcon, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsAPI } from '../services/api';
import useAuthStore from '../stores/authStore';

/**
 * Documents Page
 * Sprint 4.3 - Document Management System
 */
function Documents() {
  const { user } = useAuthStore();

  // State
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    category: '',
    status: 'active',
    search: '',
    page: 1,
    limit: 20
  });

  // Load documents
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.getAll(filters);
      setDocuments(response.data.data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load stats
  const loadStats = async () => {
    try {
      const response = await documentsAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadStats();
  }, [loadDocuments]);

  // File upload handler
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);
        formData.append('category', 'other');
        formData.append('access_level', 'private');

        const response = await documentsAPI.upload(formData);
        return { success: true, file: file.name, data: response.data.data };
      } catch (error) {
        console.error('Error uploading file:', error);
        return { success: false, file: file.name, error: error.message };
      }
    });

    const results = await Promise.all(uploadPromises);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (successCount > 0) {
      toast.success(`${successCount} archivo(s) subido(s) correctamente`);
      loadDocuments();
      loadStats();
    }

    if (failCount > 0) {
      toast.error(`${failCount} archivo(s) fallaron al subir`);
    }

    setUploading(false);
    setShowUploadModal(false);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  // Download document
  const handleDownload = async (doc) => {
    try {
      toast.loading('Descargando...', { id: 'download' });
      const response = await documentsAPI.download(doc.id);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.original_filename || doc.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Descargado correctamente', { id: 'download' });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error al descargar', { id: 'download' });
    }
  };

  // Delete document
  const handleDelete = async (doc) => {
    if (!window.confirm(`¿Eliminar documento "${doc.title || doc.original_filename}"?`)) {
      return;
    }

    try {
      await documentsAPI.delete(doc.id);
      toast.success('Documento eliminado');
      loadDocuments();
      loadStats();
      setSelectedDocument(null);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Error al eliminar documento');
    }
  };

  // Get file icon by MIME type
  const getFileIcon = (mimeType) => {
    if (!mimeType) return File;

    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Film;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return Archive;

    return File;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get category label
  const getCategoryLabel = (category) => {
    const labels = {
      contract: 'Contrato',
      invoice: 'Factura',
      receipt: 'Recibo',
      agreement: 'Acuerdo',
      legal: 'Legal',
      technical: 'Técnico',
      marketing: 'Marketing',
      rider: 'Rider',
      payment_proof: 'Comprobante de Pago',
      identification: 'Identificación',
      license: 'Licencia',
      insurance: 'Seguro',
      other: 'Otro'
    };
    return labels[category] || category;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Documentos
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gestión centralizada de documentos
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Subir Documento
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats.total_count || 0}
                </p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Espacio Usado</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats.total_size_human || '0 KB'}
                </p>
              </div>
              <Archive className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Este Mes</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats.this_month_count || 0}
                </p>
              </div>
              <Clock className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Compartidos</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats.shared_count || 0}
                </p>
              </div>
              <Share2 className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and View Toggle */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="">Todas las categorías</option>
            <option value="contract">Contratos</option>
            <option value="invoice">Facturas</option>
            <option value="receipt">Recibos</option>
            <option value="legal">Legal</option>
            <option value="technical">Técnico</option>
            <option value="marketing">Marketing</option>
            <option value="other">Otros</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Documents Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No hay documentos
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Comienza subiendo tu primer documento
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Subir Documento
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((doc) => {
            const Icon = getFileIcon(doc.mime_type);
            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer group"
                onClick={() => setSelectedDocument(doc)}
              >
                {/* Preview or Icon */}
                <div className="aspect-square mb-3 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                  {doc.mime_type?.startsWith('image/') ? (
                    <img
                      src={doc.file_url}
                      alt={doc.title || doc.original_filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon className="w-16 h-16 text-slate-400" />
                  )}
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 truncate">
                    {doc.title || doc.original_filename}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>{getCategoryLabel(doc.category)}</span>
                    <span>{formatFileSize(doc.file_size)}</span>
                  </div>
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {doc.tags.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {doc.tags.length > 2 && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                          +{doc.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(doc);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 inline mr-1" />
                    Descargar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDocument(doc);
                      setShowShareModal(true);
                    }}
                    className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                  Nombre
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                  Categoría
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                  Tamaño
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                  Fecha
                </th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {documents.map((doc) => {
                const Icon = getFileIcon(doc.mime_type);
                return (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Icon className="w-8 h-8 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {doc.title || doc.original_filename}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                            {doc.original_filename}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {getCategoryLabel(doc.category)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(doc.uploaded_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(doc);
                          }}
                          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocument(doc);
                            setShowShareModal(true);
                          }}
                          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                          title="Compartir"
                        >
                          <Share2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc);
                          }}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Subir Documentos
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragOver
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Arrastra archivos aquí o haz clic para seleccionar
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Máximo 50MB por archivo
              </p>
              <input
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
              >
                {uploading ? 'Subiendo...' : 'Seleccionar Archivos'}
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDocument && !showShareModal && !showVersionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {selectedDocument.title || selectedDocument.original_filename}
              </h2>
              <button
                onClick={() => setSelectedDocument(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Preview */}
              <div>
                <div className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden mb-4">
                  {selectedDocument.mime_type?.startsWith('image/') ? (
                    <img
                      src={selectedDocument.file_url}
                      alt={selectedDocument.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (() => {
                    const Icon = getFileIcon(selectedDocument.mime_type);
                    return <Icon className="w-32 h-32 text-slate-400" />;
                  })()}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDownload(selectedDocument)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Download className="w-4 h-4 inline mr-2" />
                    Descargar
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors text-sm"
                  >
                    <Share2 className="w-4 h-4 inline mr-2" />
                    Compartir
                  </button>
                  <button
                    onClick={() => setShowVersionsModal(true)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors text-sm"
                  >
                    <Clock className="w-4 h-4 inline mr-2" />
                    Versiones
                  </button>
                  <button
                    onClick={() => handleDelete(selectedDocument)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4 inline mr-2" />
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Nombre Original
                  </label>
                  <p className="text-slate-900 dark:text-white mt-1">
                    {selectedDocument.original_filename}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Categoría
                  </label>
                  <p className="text-slate-900 dark:text-white mt-1">
                    {getCategoryLabel(selectedDocument.category)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Tamaño
                  </label>
                  <p className="text-slate-900 dark:text-white mt-1">
                    {formatFileSize(selectedDocument.file_size)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Tipo
                  </label>
                  <p className="text-slate-900 dark:text-white mt-1">
                    {selectedDocument.mime_type}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Subido
                  </label>
                  <p className="text-slate-900 dark:text-white mt-1">
                    {new Date(selectedDocument.uploaded_at).toLocaleString('es-ES')}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Versión
                  </label>
                  <p className="text-slate-900 dark:text-white mt-1">
                    v{selectedDocument.version || 1}
                  </p>
                </div>

                {selectedDocument.description && (
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Descripción
                    </label>
                    <p className="text-slate-900 dark:text-white mt-1">
                      {selectedDocument.description}
                    </p>
                  </div>
                )}

                {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                      Etiquetas
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {selectedDocument.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedDocument && (
        <ShareModal
          document={selectedDocument}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Versions Modal */}
      {showVersionsModal && selectedDocument && (
        <VersionsModal
          document={selectedDocument}
          onClose={() => setShowVersionsModal(false)}
          onReload={loadDocuments}
        />
      )}
    </div>
  );
}

// Share Modal Component
function ShareModal({ document, onClose }) {
  const [shareLink, setShareLink] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateLink = async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.generateShareLink(document.id, {
        expires_in_days: 30
      });
      setShareLink(response.data.data);
      toast.success('Link generado correctamente');
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error('Error al generar link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/documents/shared/${shareLink.share_token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado al portapapeles');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-lg w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Compartir Documento
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Genera un link público para compartir este documento
          </p>

          {!shareLink ? (
            <button
              onClick={handleGenerateLink}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Generando...' : 'Generar Link de Compartición'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Link generado (expira en 30 días):
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/documents/shared/${shareLink.share_token}`}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Expira: {new Date(shareLink.expires_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Versions Modal Component
function VersionsModal({ document, onClose, onReload }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.getVersionHistory(document.id);
      setVersions(response.data.data || []);
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error('Error al cargar versiones');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (version) => {
    if (!window.confirm(`¿Restaurar versión ${version}?`)) return;

    try {
      await documentsAPI.rollbackVersion(document.id, version);
      toast.success('Versión restaurada correctamente');
      onReload();
      onClose();
    } catch (error) {
      console.error('Error rolling back version:', error);
      toast.error('Error al restaurar versión');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Historial de Versiones
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : versions.length === 0 ? (
          <p className="text-center text-slate-600 dark:text-slate-400 py-8">
            No hay versiones anteriores
          </p>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.version}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Versión {version.version}
                      {version.version === document.version && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs rounded">
                          Actual
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {new Date(version.created_at).toLocaleString('es-ES')}
                    </p>
                    {version.change_description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {version.change_description}
                      </p>
                    )}
                  </div>
                  {version.version !== document.version && (
                    <button
                      onClick={() => handleRollback(version.version)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                      Restaurar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Documents;
