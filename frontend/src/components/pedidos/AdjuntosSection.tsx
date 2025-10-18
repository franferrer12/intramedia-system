import { FC, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  File,
  FileText,
  Image,
  Download,
  Trash2,
  X,
  Check,
  AlertCircle,
  Paperclip,
} from 'lucide-react';
import { adjuntosPedidoApi, AdjuntoPedido } from '../../api/adjuntos-pedido.api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface AdjuntosSectionProps {
  pedidoId: number;
}

const TIPO_ADJUNTO_OPTIONS = [
  { value: 'FACTURA', label: 'Factura', color: 'bg-green-100 text-green-800' },
  { value: 'ALBARAN', label: 'Albarán', color: 'bg-blue-100 text-blue-800' },
  { value: 'CONTRATO', label: 'Contrato', color: 'bg-purple-100 text-purple-800' },
  { value: 'PRESUPUESTO', label: 'Presupuesto', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'NOTA_ENTREGA', label: 'Nota de Entrega', color: 'bg-orange-100 text-orange-800' },
  { value: 'OTRO', label: 'Otro', color: 'bg-gray-100 text-gray-800' },
];

export const AdjuntosSection: FC<AdjuntosSectionProps> = ({ pedidoId }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [tipoArchivo, setTipoArchivo] = useState('FACTURA');
  const [descripcion, setDescripcion] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Cargar adjuntos
  const { data: adjuntos = [], isLoading } = useQuery({
    queryKey: ['adjuntos-pedido', pedidoId],
    queryFn: () => adjuntosPedidoApi.getAdjuntosPedido(pedidoId),
  });

  // Mutación para subir adjunto
  const subirMutation = useMutation({
    mutationFn: (data: { file: File; tipo: string; descripcion: string }) =>
      adjuntosPedidoApi.subirAdjunto(pedidoId, data.file, data.tipo, data.descripcion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjuntos-pedido', pedidoId] });
      toast.success('Archivo subido correctamente');
      resetearFormulario();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al subir el archivo');
    },
  });

  // Mutación para eliminar adjunto
  const eliminarMutation = useMutation({
    mutationFn: adjuntosPedidoApi.eliminarAdjunto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjuntos-pedido', pedidoId] });
      toast.success('Archivo eliminado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar el archivo');
    },
  });

  const resetearFormulario = () => {
    setArchivoSeleccionado(null);
    setTipoArchivo('FACTURA');
    setDescripcion('');
    setMostrarFormulario(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArchivoSeleccionado(e.target.files[0]);
      setMostrarFormulario(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setArchivoSeleccionado(e.dataTransfer.files[0]);
      setMostrarFormulario(true);
    }
  };

  const handleSubir = () => {
    if (!archivoSeleccionado) return;

    subirMutation.mutate({
      file: archivoSeleccionado,
      tipo: tipoArchivo,
      descripcion,
    });
  };

  const handleDescargar = async (adjunto: AdjuntoPedido) => {
    try {
      await adjuntosPedidoApi.descargarAdjunto(adjunto.id, adjunto.nombreOriginal);
      toast.success('Descarga iniciada');
    } catch (error) {
      toast.error('Error al descargar el archivo');
    }
  };

  const handleEliminar = async (adjuntoId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
      eliminarMutation.mutate(adjuntoId);
    }
  };

  const getIconoArchivo = (adjunto: AdjuntoPedido) => {
    if (adjunto.esImagen) {
      return <Image className="h-5 w-5 text-blue-600" />;
    } else if (adjunto.esPdf) {
      return <FileText className="h-5 w-5 text-red-600" />;
    } else {
      return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    const opcion = TIPO_ADJUNTO_OPTIONS.find((o) => o.value === tipo);
    return opcion?.color || 'bg-gray-100 text-gray-800';
  };

  const getTipoLabel = (tipo: string) => {
    const opcion = TIPO_ADJUNTO_OPTIONS.find((o) => o.value === tipo);
    return opcion?.label || tipo;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Archivos Adjuntos ({adjuntos.length})
          </h3>
        </div>
        {!mostrarFormulario && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Subir Archivo
          </button>
        )}
      </div>

      {/* Input oculto para archivos */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
      />

      {/* Zona de drag & drop */}
      {!mostrarFormulario && adjuntos.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 bg-gray-50 hover:border-indigo-400'
          }`}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">
            Arrastra archivos aquí o haz clic en "Subir Archivo"
          </p>
          <p className="text-sm text-gray-500">
            PDF, imágenes, documentos Word/Excel (máx. 10 MB)
          </p>
        </div>
      )}

      {/* Formulario de subida */}
      {mostrarFormulario && archivoSeleccionado && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Subir Archivo</h4>
            <button
              onClick={resetearFormulario}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-white rounded-lg p-3 flex items-center gap-3">
            <File className="h-6 w-6 text-gray-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{archivoSeleccionado.name}</p>
              <p className="text-xs text-gray-500">
                {(archivoSeleccionado.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento
            </label>
            <select
              value={tipoArchivo}
              onChange={(e) => setTipoArchivo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {TIPO_ADJUNTO_OPTIONS.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Añade una descripción del archivo..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubir}
              disabled={subirMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {subirMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Subir Archivo
                </>
              )}
            </button>
            <button
              onClick={resetearFormulario}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de adjuntos */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Cargando archivos...</p>
        </div>
      ) : adjuntos.length > 0 ? (
        <div className="space-y-2">
          {adjuntos.map((adjunto) => (
            <div
              key={adjunto.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">{getIconoArchivo(adjunto)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-gray-900 truncate">
                        {adjunto.nombreOriginal}
                      </h5>
                      {adjunto.descripcion && (
                        <p className="text-xs text-gray-600 mt-1">{adjunto.descripcion}</p>
                      )}
                    </div>
                    <span
                      className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${getTipoColor(
                        adjunto.tipoArchivo
                      )}`}
                    >
                      {getTipoLabel(adjunto.tipoArchivo)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{adjunto.tamanioLegible}</span>
                    <span>
                      {format(new Date(adjunto.fechaSubida), "dd MMM yyyy 'a las' HH:mm", {
                        locale: es,
                      })}
                    </span>
                    {adjunto.subidoPorNombre && <span>por {adjunto.subidoPorNombre}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDescargar(adjunto)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Descargar"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEliminar(adjunto.id)}
                    disabled={eliminarMutation.isPending}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !mostrarFormulario ? (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No hay archivos adjuntos</p>
        </div>
      ) : null}
    </div>
  );
};
