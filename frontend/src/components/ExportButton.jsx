import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Función para convertir JSON a CSV
const convertirACSV = (datos, nombreArchivo) => {
  if (!datos || datos.length === 0) {
    toast.error('No hay datos para exportar');
    return;
  }

  // Obtener headers
  const headers = Object.keys(datos[0]);

  // Crear CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...datos.map(row =>
      headers.map(header => {
        const valor = row[header];
        // Escapar comas y comillas
        if (typeof valor === 'string' && (valor.includes(',') || valor.includes('"'))) {
          return `"${valor.replace(/"/g, '""')}"`;
        }
        return valor;
      }).join(',')
    )
  ].join('\n');

  // Descargar archivo
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${nombreArchivo}.csv`;
  link.click();

  toast.success('Archivo CSV descargado');
};

// Función para convertir JSON a Excel (formato CSV mejorado)
const convertirAExcel = (datos, nombreArchivo) => {
  if (!datos || datos.length === 0) {
    toast.error('No hay datos para exportar');
    return;
  }

  // Excel puede leer CSV con formato especial
  const headers = Object.keys(datos[0]);

  // Crear contenido con separador de tabulación para mejor compatibilidad con Excel
  const excelContent = [
    headers.join('\t'),
    ...datos.map(row =>
      headers.map(header => {
        const valor = row[header];
        return valor !== null && valor !== undefined ? valor : '';
      }).join('\t')
    )
  ].join('\n');

  const blob = new Blob(['\ufeff' + excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${nombreArchivo}.xls`;
  link.click();

  toast.success('Archivo Excel descargado');
};

// Función para exportar JSON
const exportarJSON = (datos, nombreArchivo) => {
  if (!datos || datos.length === 0) {
    toast.error('No hay datos para exportar');
    return;
  }

  const jsonContent = JSON.stringify(datos, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${nombreArchivo}.json`;
  link.click();

  toast.success('Archivo JSON descargado');
};

const ExportButton = ({ datos, nombreArchivo = 'export', label = 'Exportar', className = '' }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleExport = async (tipo) => {
    setDownloading(true);
    setShowMenu(false);

    // Pequeño delay para animación
    await new Promise(resolve => setTimeout(resolve, 300));

    switch (tipo) {
      case 'csv':
        convertirACSV(datos, nombreArchivo);
        break;
      case 'excel':
        convertirAExcel(datos, nombreArchivo);
        break;
      case 'json':
        exportarJSON(datos, nombreArchivo);
        break;
      default:
        break;
    }

    setDownloading(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`
          btn btn-primary flex items-center gap-2
          ${className}
          ${downloading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        disabled={downloading}
      >
        {downloading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Descargando...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Menú desplegable */}
      {showMenu && !downloading && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-slideDown">
          <div className="p-2 space-y-1">
            {/* CSV */}
            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">CSV</div>
                <div className="text-xs text-gray-500">Para Excel, Sheets</div>
              </div>
            </button>

            {/* Excel */}
            <button
              onClick={() => handleExport('excel')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Excel (.xls)</div>
                <div className="text-xs text-gray-500">Microsoft Excel</div>
              </div>
            </button>

            {/* JSON */}
            <button
              onClick={() => handleExport('json')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">JSON</div>
                <div className="text-xs text-gray-500">Formato de datos</div>
              </div>
            </button>
          </div>

          <div className="border-t border-gray-200 p-2">
            <div className="text-xs text-gray-500 px-4 py-2">
              {datos?.length || 0} registros para exportar
            </div>
          </div>
        </div>
      )}

      {/* Overlay para cerrar el menú */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        ></div>
      )}

      {/* CSS para animación */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

// Componente de botón de exportación rápida (sin menú)
export const QuickExportCSV = ({ datos, nombreArchivo = 'export', className = '' }) => {
  const [downloading, setDownloading] = useState(false);

  const handleExport = async () => {
    setDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    convertirACSV(datos, nombreArchivo);
    setDownloading(false);
  };

  return (
    <button
      onClick={handleExport}
      disabled={downloading}
      className={`
        btn btn-secondary flex items-center gap-2
        ${className}
        ${downloading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {downloading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
      ) : (
        <FileSpreadsheet className="w-4 h-4" />
      )}
      <span>CSV</span>
    </button>
  );
};

export default ExportButton;
