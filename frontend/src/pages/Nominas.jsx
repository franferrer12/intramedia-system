import { useState } from 'react';
import { DollarSign, Download, Home, FileText } from 'lucide-react';
import { Breadcrumbs, Select } from '../components';

const Nominas = () => {
  const [selectedMonth, setSelectedMonth] = useState('JUNIO');

  const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Inicio', path: '/', icon: Home },
          { label: 'Nóminas', path: '/nominas', icon: FileText }
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nóminas DJs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestión de pagos mensuales</p>
        </div>
        <div className="flex gap-3">
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-48"
          >
            {meses.map(mes => (
              <option key={mes} value={mes}>{mes}</option>
            ))}
          </Select>
          <button className="btn btn-primary flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total a Pagar</p>
              <p className="text-3xl font-bold text-primary-600">0€</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pagados</p>
              <p className="text-3xl font-bold text-green-600">0€</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pendientes</p>
              <p className="text-3xl font-bold text-red-600">0€</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-0">
        <div className="p-6 border-b border-gray-200 dark:border-white/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nóminas - {selectedMonth}
          </h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">DJ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Eventos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Media/Evento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total a Pagar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                No hay datos de nóminas para {selectedMonth}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Nominas;
