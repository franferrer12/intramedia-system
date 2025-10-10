import { FC, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Calculator, TrendingUp, Beer, Droplet } from 'lucide-react';
import { productosApi } from '../../api/productos.api';
import { proveedoresApi } from '../../api/proveedores.api';
import { Producto, ProductoFormData, TipoVenta } from '../../types';
import { Button } from '../ui/Button';
import { notify, handleApiError } from '../../utils/notifications';

interface ProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto?: Producto | null;
}

const UNIDADES_MEDIDA = [
  'Unidad',
  'Botella',
  'Litro',
  'Mililitro',
  'Caja',
  'Paquete',
  'Kilogramo',
  'Gramo',
];

const CAPACIDADES_COMUNES = [
  { value: 700, label: '700ml' },
  { value: 750, label: '750ml' },
  { value: 1000, label: '1 Litro' },
  { value: 1500, label: '1.5 Litros' },
  { value: 3000, label: '3 Litros' },
];

export const ProductoModal: FC<ProductoModalProps> = ({ isOpen, onClose, producto }) => {
  const queryClient = useQueryClient();
  const isEdit = !!producto;

  const [formData, setFormData] = useState<ProductoFormData>({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    unidadMedida: 'Botella',
    proveedorId: undefined,
    precioCompra: 0,
    precioVenta: 0,
    stockActual: 0,
    stockMinimo: 0,
    stockMaximo: undefined,
    activo: true,
    perecedero: false,
    diasCaducidad: undefined,
    imagenUrl: '',
    notas: '',
    // Campos ocio nocturno
    capacidadMl: 1000,
    tipoVenta: 'COPA',
    mlPorServicio: 90,
    factorMerma: 10,
  });

  const [metricas, setMetricas] = useState<any>(null);
  const [calculando, setCalculando] = useState(false);
  const [mostrarOcioNocturno, setMostrarOcioNocturno] = useState(false);

  const { data: categorias = [] } = useQuery<string[]>({
    queryKey: ['productos-categorias'],
    queryFn: productosApi.getCategorias,
    enabled: isOpen,
  });

  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores-activos'],
    queryFn: proveedoresApi.getActivos,
    enabled: isOpen,
  });

  const { data: tiposVenta = [] } = useQuery({
    queryKey: ['tipos-venta'],
    queryFn: productosApi.getTiposVenta,
    enabled: isOpen,
  });

  // Cargar presets cuando cambia el tipo de venta
  useEffect(() => {
    if (formData.tipoVenta && isOpen) {
      productosApi.getPresets(formData.tipoVenta).then((preset) => {
        setFormData((prev) => ({
          ...prev,
          mlPorServicio: preset.mlPorServicio || prev.mlPorServicio,
          factorMerma: preset.factorMerma,
        }));
      });
    }
  }, [formData.tipoVenta, isOpen]);

  // Calcular métricas en tiempo real
  useEffect(() => {
    if (
      formData.precioCompra > 0 &&
      formData.precioVenta > 0 &&
      formData.capacidadMl &&
      formData.tipoVenta
    ) {
      setCalculando(true);
      const timer = setTimeout(() => {
        productosApi
          .calcularMetricas({
            precioCompra: formData.precioCompra,
            precioVenta: formData.precioVenta,
            capacidadMl: formData.capacidadMl!,
            tipoVenta: formData.tipoVenta!,
            mlPorServicio: formData.mlPorServicio,
            factorMerma: formData.factorMerma,
          })
          .then((data) => {
            setMetricas(data);
            setCalculando(false);
          })
          .catch(() => {
            setCalculando(false);
          });
      }, 500); // Debounce 500ms

      return () => clearTimeout(timer);
    }
  }, [
    formData.precioCompra,
    formData.precioVenta,
    formData.capacidadMl,
    formData.tipoVenta,
    formData.mlPorServicio,
    formData.factorMerma,
  ]);

  useEffect(() => {
    if (producto) {
      setFormData({
        codigo: producto.codigo,
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        categoria: producto.categoria,
        unidadMedida: producto.unidadMedida,
        proveedorId: producto.proveedorId,
        precioCompra: producto.precioCompra,
        precioVenta: producto.precioVenta,
        stockActual: producto.stockActual,
        stockMinimo: producto.stockMinimo,
        stockMaximo: producto.stockMaximo,
        activo: producto.activo,
        perecedero: producto.perecedero,
        diasCaducidad: producto.diasCaducidad,
        imagenUrl: producto.imagenUrl,
        notas: producto.notas || '',
        capacidadMl: producto.capacidadMl || 1000,
        tipoVenta: producto.tipoVenta || 'COPA',
        mlPorServicio: producto.mlPorServicio || 90,
        factorMerma: producto.factorMerma || 10,
      });
      // Si el producto tiene tipoVenta definido, mostrar ocio nocturno
      setMostrarOcioNocturno(!!producto.tipoVenta);
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        categoria: '',
        unidadMedida: 'Botella',
        proveedorId: undefined,
        precioCompra: 0,
        precioVenta: 0,
        stockActual: 0,
        stockMinimo: 0,
        stockMaximo: undefined,
        activo: true,
        perecedero: false,
        diasCaducidad: undefined,
        imagenUrl: '',
        notas: '',
        capacidadMl: 1000,
        tipoVenta: 'COPA',
        mlPorServicio: 90,
        factorMerma: 10,
      });
      setMostrarOcioNocturno(false);
    }
    setMetricas(null);
  }, [producto, isOpen]);

  const createMutation = useMutation({
    mutationFn: productosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      notify.success('Producto creado correctamente');
      onClose();
    },
    onError: (error) => {
      handleApiError(error, 'Error al crear el producto');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoFormData }) =>
      productosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      notify.success('Producto actualizado correctamente');
      onClose();
    },
    onError: (error) => {
      handleApiError(error, 'Error al actualizar el producto');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.codigo.trim()) {
      notify.error('El código es obligatorio');
      return;
    }
    if (!formData.nombre.trim()) {
      notify.error('El nombre es obligatorio');
      return;
    }
    if (!formData.categoria) {
      notify.error('La categoría es obligatoria');
      return;
    }
    if (formData.precioCompra <= 0) {
      notify.error('El precio de compra debe ser mayor a 0');
      return;
    }
    if (formData.precioVenta <= 0) {
      notify.error('El precio de venta debe ser mayor a 0');
      return;
    }

    // Limpiar campos opcionales vacíos
    const dataToSubmit: ProductoFormData = {
      ...formData,
      descripcion: formData.descripcion?.trim() || undefined,
      proveedorId: formData.proveedorId || undefined,
      stockMaximo: formData.stockMaximo || undefined,
      diasCaducidad: formData.perecedero ? formData.diasCaducidad : undefined,
      imagenUrl: formData.imagenUrl?.trim() || undefined,
      notas: formData.notas?.trim() || undefined,
    };

    if (isEdit && producto) {
      updateMutation.mutate({ id: producto.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative inline-block w-full max-w-6xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid con 2 columnas: Formulario | Panel de Cálculos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna izquierda: Formulario (2/3) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Código y Nombre */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Categoría, Unidad de Medida, Proveedor */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      list="categorias-list"
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      placeholder="Escribe categoría: Licores, Vinos, Cervezas, Refrescos..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <datalist id="categorias-list">
                      <option value="Licores" />
                      <option value="Vinos" />
                      <option value="Cervezas" />
                      <option value="Refrescos y Mezcladores" />
                      <option value="Licores Dulces" />
                      <option value="Snacks" />
                      {categorias.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad de Medida <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.unidadMedida}
                      onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {UNIDADES_MEDIDA.map((unidad) => (
                        <option key={unidad} value={unidad}>
                          {unidad}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                    <select
                      value={formData.proveedorId || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          proveedorId: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sin proveedor</option>
                      {proveedores.map((prov) => (
                        <option key={prov.id} value={prov.id}>
                          {prov.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* === SECCIÓN OCIO NOCTURNO === */}
                {mostrarOcioNocturno && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Beer className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Configuración de Ocio Nocturno</h4>
                    </div>

                    {/* Tipo de Venta */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Venta <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {tiposVenta.map((tipo: any) => (
                          <button
                            key={tipo.value}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, tipoVenta: tipo.value as TipoVenta })
                            }
                            className={`p-3 border-2 rounded-lg text-left transition-all ${
                              formData.tipoVenta === tipo.value
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-gray-300 hover:border-purple-300'
                            }`}
                          >
                            <div className="font-semibold text-sm">{tipo.label}</div>
                            <div className="text-xs text-gray-500 mt-1">{tipo.descripcion}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Capacidad de la Botella */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Capacidad de la Botella (ml)
                      </label>
                      <div className="flex gap-2">
                        {CAPACIDADES_COMUNES.map((cap) => (
                          <button
                            key={cap.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, capacidadMl: cap.value })}
                            className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                              formData.capacidadMl === cap.value
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {cap.label}
                          </button>
                        ))}
                        <input
                          type="number"
                          value={formData.capacidadMl || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, capacidadMl: parseFloat(e.target.value) || 0 })
                          }
                          placeholder="Otro..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    {/* ML por Servicio y Factor de Merma */}
                    {formData.tipoVenta !== 'BOTELLA' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Droplet className="w-4 h-4 inline mr-1" />
                            ML por Servicio
                          </label>
                          <input
                            type="number"
                            step="1"
                            value={formData.mlPorServicio || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                mlPorServicio: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.tipoVenta === 'COPA' ? '90ml = 6 segundos' : '30ml = 2 segundos'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Factor de Merma (%)
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            value={formData.factorMerma || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, factorMerma: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Desperdicio/derrame estimado</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Precios */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio de Compra (€) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.precioCompra}
                      onChange={(e) =>
                        setFormData({ ...formData, precioCompra: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Precio por botella</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio de Venta (€) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.precioVenta}
                      onChange={(e) =>
                        setFormData({ ...formData, precioVenta: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.tipoVenta === 'BOTELLA' ? 'Precio por botella' : 'Precio por servicio'}
                    </p>
                  </div>
                </div>

                {/* Stock */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.stockActual}
                      onChange={(e) =>
                        setFormData({ ...formData, stockActual: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Mínimo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.stockMinimo}
                      onChange={(e) =>
                        setFormData({ ...formData, stockMinimo: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Máximo</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.stockMaximo || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stockMaximo: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="activo"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="activo" className="ml-2 block text-sm text-gray-700">
                      Producto Activo
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="perecedero"
                      checked={formData.perecedero}
                      onChange={(e) => setFormData({ ...formData, perecedero: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="perecedero" className="ml-2 block text-sm text-gray-700">
                      Producto Perecedero
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="ocioNocturno"
                      checked={mostrarOcioNocturno}
                      onChange={(e) => setMostrarOcioNocturno(e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="ocioNocturno" className="ml-2 block text-sm text-gray-700 flex items-center gap-1">
                      <Beer className="w-4 h-4 text-purple-600" />
                      Venta por Copa/Chupito
                    </label>
                  </div>
                </div>

                {/* Días de Caducidad */}
                {formData.perecedero && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Días de Caducidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.diasCaducidad || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          diasCaducidad: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Columna derecha: Panel de Cálculos (1/3) */}
              {mostrarOcioNocturno && (
                <div className="lg:col-span-1">
                  <div className="sticky top-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Calculator className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Cálculos en Tiempo Real</h4>
                    </div>

                    {calculando && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                        Calculando...
                      </div>
                    )}

                    {!calculando && metricas && (
                      <div className="space-y-3">
                        {/* Unidades por Botella */}
                        {metricas.tipoVenta !== 'BOTELLA' && (
                          <>
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                              <div className="text-xs text-gray-500 mb-1">Unidades Teóricas</div>
                              <div className="text-2xl font-bold text-gray-900">
                                {metricas.unidadesTeorica?.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {metricas.capacidadMl}ml ÷ {metricas.mlPorServicio}ml
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 shadow-sm">
                              <div className="text-xs text-gray-500 mb-1">Unidades Reales</div>
                              <div className="text-2xl font-bold text-green-600">
                                {metricas.unidadesReales?.toFixed(0)}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Con {metricas.factorMerma}% merma
                              </div>
                            </div>
                          </>
                        )}

                        {/* Ingresos por Botella */}
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-xs text-gray-500 mb-1">Ingreso Total Estimado</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {metricas.ingresoTotalEstimado?.toFixed(2)}€
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {metricas.tipoVenta === 'BOTELLA'
                              ? 'Por botella'
                              : `${metricas.unidadesReales?.toFixed(0)} × ${metricas.precioVenta}€`}
                          </div>
                        </div>

                        {/* Beneficio */}
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-xs text-gray-500 mb-1">Beneficio Unitario</div>
                          <div className="text-2xl font-bold text-green-600">
                            {metricas.beneficioUnitario?.toFixed(2)}€
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {metricas.ingresoTotalEstimado?.toFixed(2)}€ -{' '}
                            {metricas.precioCompra?.toFixed(2)}€
                          </div>
                        </div>

                        {/* Margen */}
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 text-white shadow-md">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <div className="text-xs font-medium">Margen de Beneficio</div>
                          </div>
                          <div className="text-4xl font-bold">
                            {metricas.margenPorcentaje?.toFixed(0)}%
                          </div>
                          <div className="text-xs mt-2 opacity-90">
                            {metricas.margenPorcentaje > 400 && '🔥 ¡Excelente rentabilidad!'}
                            {metricas.margenPorcentaje > 200 &&
                              metricas.margenPorcentaje <= 400 &&
                              '✅ Muy buen margen'}
                            {metricas.margenPorcentaje <= 200 && '⚠️ Margen moderado'}
                          </div>
                        </div>
                      </div>
                    )}

                    {!calculando && !metricas && (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        Completa los precios y capacidad para ver los cálculos
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
