import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import {
  formatEquipmentType,
  getStatusColorClass
} from '../services/equipmentService';

/**
 * Equipment List Component
 * Displays equipment in a responsive grid/table layout
 */
const EquipmentList = ({ equipment, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (!equipment || equipment.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="max-w-md mx-auto">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No hay equipos
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comienza agregando tu primer equipo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Equipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Precios
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {equipment.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {item.foto_url ? (
                      <img
                        src={item.foto_url}
                        alt={item.modelo}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                          {item.marca?.[0] || 'E'}
                        </span>
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.marca} {item.modelo}
                      </div>
                      {item.numero_serie && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          S/N: {item.numero_serie}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatEquipmentType(item.tipo)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {item.cantidad_disponible !== undefined ? (
                      <>
                        <span className="font-medium">{item.cantidad_disponible}</span>
                        <span className="text-gray-500 dark:text-gray-400"> / {item.cantidad}</span>
                      </>
                    ) : (
                      <span>{item.cantidad}</span>
                    )}
                  </div>
                  {item.cantidad_disponible !== undefined && item.cantidad_disponible < item.cantidad && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.cantidad_alquilada} en uso
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(item.estado)}`}>
                    {item.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div>
                    {item.precio_alquiler_dia && (
                      <div className="text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Día:</span> ${item.precio_alquiler_dia}
                      </div>
                    )}
                    {item.precio_alquiler_evento && (
                      <div className="text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Evento:</span> ${item.precio_alquiler_evento}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Editar"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {equipment.map((item) => (
          <div key={item.id} className="p-4">
            <div className="flex items-start space-x-4">
              {item.foto_url ? (
                <img
                  src={item.foto_url}
                  alt={item.modelo}
                  className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                    {item.marca?.[0] || 'E'}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.marca} {item.modelo}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatEquipmentType(item.tipo)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(item.estado)}`}>
                    {item.estado}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Cantidad:</span>
                    <span className="ml-1 text-gray-900 dark:text-white font-medium">
                      {item.cantidad_disponible !== undefined
                        ? `${item.cantidad_disponible}/${item.cantidad}`
                        : item.cantidad
                      }
                    </span>
                  </div>
                  {item.precio_alquiler_evento && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Precio:</span>
                      <span className="ml-1 text-gray-900 dark:text-white font-medium">
                        ${item.precio_alquiler_evento}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-1.5 border border-red-300 dark:border-red-600 text-xs font-medium rounded-lg text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EquipmentList;
