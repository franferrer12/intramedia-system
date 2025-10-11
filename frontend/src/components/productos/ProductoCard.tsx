import { FC } from 'react';
import { Producto } from '../../types';
import { Edit, Trash2, AlertTriangle, CheckCircle2, XCircle, Wine, Droplet, TrendingUp } from 'lucide-react';

interface ProductoCardProps {
  producto: Producto;
  onEdit: (producto: Producto) => void;
  onDelete: (id: number, nombre: string) => void;
}

export const ProductoCard: FC<ProductoCardProps> = ({ producto, onEdit, onDelete }) => {
  // Calculate stock percentage
  const getStockPercentage = () => {
    if (producto.stockMaximo && producto.stockMaximo > 0) {
      return (producto.stockActual / producto.stockMaximo) * 100;
    }
    const reference = producto.stockMinimo * 2;
    if (reference > 0) {
      return Math.min((producto.stockActual / reference) * 100, 100);
    }
    return 100;
  };

  // Render tipo de venta badge
  const renderTipoVentaBadge = () => {
    if (!producto.tipoVenta) return null;

    const badges = {
      COPA: { label: 'Copa', color: 'bg-purple-100 text-purple-800', icon: Wine },
      CHUPITO: { label: 'Chupito', color: 'bg-orange-100 text-orange-800', icon: Droplet },
      BOTELLA: { label: 'Botella', color: 'bg-blue-100 text-blue-800', icon: Wine },
    };

    const badge = badges[producto.tipoVenta];
    if (!badge) return null;

    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  // Calcular servicios disponibles
  const calcularServiciosDisponibles = (): string => {
    if (!producto.tipoVenta || producto.tipoVenta === 'BOTELLA') {
      return `${producto.stockActual} bot.`;
    }

    if (producto.unidadesReales) {
      const servicios = Math.floor(producto.stockActual * producto.unidadesReales);
      return `${servicios} serv.`;
    }

    return `${producto.stockActual} bot.`;
  };

  // Get stock status
  const getStockStatus = () => {
    if (producto.sinStock) {
      return {
        icon: <XCircle className="h-5 w-5 text-red-600" />,
        text: 'Sin stock',
        textColor: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        barColor: 'bg-red-600',
      };
    }
    if (producto.bajoStock) {
      return {
        icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
        text: `${producto.stockActual} ${producto.unidadMedida}`,
        textColor: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        barColor: 'bg-yellow-500',
      };
    }
    return {
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      text: `${producto.stockActual} ${producto.unidadMedida}`,
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      barColor: 'bg-green-600',
    };
  };

  const stockStatus = getStockStatus();
  const margen = producto.margenPorcentaje || producto.margenBeneficio || 0;

  // Margen color
  const getMargenColor = () => {
    if (margen >= 400) return 'text-green-700 bg-green-100';
    if (margen >= 200) return 'text-blue-700 bg-blue-100';
    if (margen >= 100) return 'text-yellow-700 bg-yellow-100';
    if (margen < 50) return 'text-red-700 bg-red-100';
    return 'text-gray-700 bg-gray-100';
  };

  return (
    <div className={`bg-white rounded-lg border-2 ${stockStatus.borderColor} shadow-sm p-4 hover:shadow-md transition-shadow`}>
      {/* Header: Nombre y código */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{producto.nombre}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 font-mono">{producto.codigo}</span>
            {producto.proveedorNombre && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-500 truncate">{producto.proveedorNombre}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onEdit(producto)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            aria-label="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(producto.id, producto.nombre)}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            aria-label="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Badges: Categoría y Tipo */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
          {producto.categoria}
        </span>
        {renderTipoVentaBadge()}
        <span className={`px-2 py-1 text-xs font-medium rounded ${producto.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {producto.activo ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Stock status con barra de progreso */}
      <div className={`${stockStatus.bgColor} rounded-lg p-3 mb-3`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {stockStatus.icon}
            <span className={`font-semibold ${stockStatus.textColor}`}>{stockStatus.text}</span>
          </div>
          <span className="text-sm text-gray-600">Mín: {producto.stockMinimo}</span>
        </div>
        <div className="w-full bg-white rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all ${stockStatus.barColor}`}
            style={{ width: `${Math.min(getStockPercentage(), 100)}%` }}
          ></div>
        </div>
        {producto.tipoVenta && producto.tipoVenta !== 'BOTELLA' && producto.unidadesReales && (
          <div className="mt-2 text-sm text-gray-600">
            <strong>{calcularServiciosDisponibles()}</strong> disponibles
          </div>
        )}
      </div>

      {/* Detalles: Grid de información */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Capacidad */}
        {producto.capacidadMl && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Capacidad</div>
            <div className="text-sm font-medium text-gray-900">{producto.capacidadMl}ml</div>
          </div>
        )}

        {/* Unidades/Botella */}
        {producto.unidadesReales && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Unid./Botella</div>
            <div className="text-sm font-medium text-gray-900">
              {producto.unidadesReales.toFixed(0)}
              {producto.mlPorServicio && (
                <span className="text-xs text-gray-500 ml-1">({producto.mlPorServicio}ml/s)</span>
              )}
            </div>
          </div>
        )}

        {/* Precio Compra */}
        <div>
          <div className="text-xs text-gray-500 mb-1">P. Compra</div>
          <div className="text-sm font-medium text-gray-900">€{producto.precioCompra.toFixed(2)}</div>
        </div>

        {/* Precio Venta */}
        <div>
          <div className="text-xs text-gray-500 mb-1">P. Venta</div>
          <div className="text-sm font-medium text-gray-900">
            €{producto.precioVenta.toFixed(2)}
            {producto.tipoVenta && producto.tipoVenta !== 'BOTELLA' && (
              <span className="text-xs text-gray-500">/serv</span>
            )}
          </div>
        </div>
      </div>

      {/* Margen */}
      <div className="flex items-center justify-between pt-3 border-t">
        <span className="text-sm text-gray-600">Margen</span>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${getMargenColor()}`}>
          <TrendingUp className="h-4 w-4" />
          <span className="font-bold text-sm">{margen.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};
