import { useState, useEffect } from 'react';
import { clientesAPI } from '../services/api';
import { Plus, Building2, Home } from 'lucide-react';
import { Breadcrumbs, Table, TableCell, StatusBadge, SkeletonTable } from '../components';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const res = await clientesAPI.getAll();
      setClientes(res.data.data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'ciudad', label: 'Ciudad' },
    { key: 'contacto', label: 'Contacto' },
    { key: 'email', label: 'Email' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'activo', label: 'Estado' }
  ];

  const data = clientes.map(cliente => ({
    id: cliente.id,
    nombre: (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <span className="font-medium">{cliente.nombre}</span>
      </div>
    ),
    ciudad: cliente.ciudad || '-',
    contacto: cliente.contacto || '-',
    email: cliente.email || '-',
    telefono: cliente.telefono || '-',
    activo: (
      <StatusBadge status={cliente.activo ? 'active' : 'inactive'}>
        {cliente.activo ? 'Activo' : 'Inactivo'}
      </StatusBadge>
    )
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Inicio', path: '/', icon: Home },
          { label: 'Clientes', path: '/clientes', icon: Building2 }
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clientes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona locales y clientes</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {loading ? (
        <SkeletonTable columns={6} rows={5} />
      ) : (
        <Table
          columns={columns}
          data={data}
          emptyMessage="No hay clientes registrados"
        />
      )}
    </div>
  );
};

export default Clientes;
