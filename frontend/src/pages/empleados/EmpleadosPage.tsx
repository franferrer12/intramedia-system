import { useState, useEffect } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmpleadoModal } from '../../components/empleados/EmpleadoModal';
import { empleadosApi } from '../../api/empleados.api';
import { Empleado, EmpleadoFormData } from '../../types';
import { Plus, Users, Edit2, Trash2, UserX, UserCheck, Phone, DollarSign, Search, Briefcase, Building2 } from 'lucide-react';
import { notify, handleApiError } from '../../utils/notifications';

export const EmpleadosPage = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [filteredEmpleados, setFilteredEmpleados] = useState<Empleado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | undefined>();
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('ACTIVOS');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEmpleados();
  }, []);

  useEffect(() => {
    filterEmpleados();
  }, [empleados, filtroEstado, searchTerm]);

  const loadEmpleados = async () => {
    try {
      setIsLoading(true);
      const data = await empleadosApi.getAll();
      setEmpleados(data);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      handleApiError(error, 'Error al cargar los empleados');
    } finally {
      setIsLoading(false);
    }
  };

  const filterEmpleados = () => {
    let filtered = [...empleados];

    // Filtrar por estado
    if (filtroEstado === 'ACTIVOS') {
      filtered = filtered.filter(e => e.activo);
    } else if (filtroEstado === 'INACTIVOS') {
      filtered = filtered.filter(e => !e.activo);
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.nombre.toLowerCase().includes(search) ||
        e.apellidos.toLowerCase().includes(search) ||
        e.dni.toLowerCase().includes(search) ||
        e.cargo.toLowerCase().includes(search) ||
        (e.departamento && e.departamento.toLowerCase().includes(search))
      );
    }

    // Ordenar por nombre
    filtered.sort((a, b) => {
      const nombreA = `${a.nombre} ${a.apellidos}`.toLowerCase();
      const nombreB = `${b.nombre} ${b.apellidos}`.toLowerCase();
      return nombreA.localeCompare(nombreB);
    });

    setFilteredEmpleados(filtered);
  };

  const handleCreate = () => {
    setSelectedEmpleado(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (empleado: Empleado) => {
    setSelectedEmpleado(empleado);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este empleado? Esta acción no se puede deshacer.')) return;

    try {
      await empleadosApi.delete(id);
      notify.success('Empleado eliminado correctamente');
      loadEmpleados();
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      handleApiError(error, 'Error al eliminar el empleado');
    }
  };

  const handleDarDeBaja = async (id: number) => {
    if (!confirm('¿Estás seguro de dar de baja a este empleado?')) return;

    try {
      await empleadosApi.darDeBaja(id);
      notify.success('Empleado dado de baja correctamente');
      loadEmpleados();
    } catch (error) {
      console.error('Error al dar de baja empleado:', error);
      handleApiError(error, 'Error al dar de baja al empleado');
    }
  };

  const handleReactivar = async (id: number) => {
    if (!confirm('¿Estás seguro de reactivar a este empleado?')) return;

    try {
      await empleadosApi.reactivar(id);
      notify.success('Empleado reactivado correctamente');
      loadEmpleados();
    } catch (error) {
      console.error('Error al reactivar empleado:', error);
      handleApiError(error, 'Error al reactivar al empleado');
    }
  };

  const handleSubmit = async (data: EmpleadoFormData) => {
    try {
      if (selectedEmpleado) {
        await empleadosApi.update(selectedEmpleado.id, data);
        notify.success('Empleado actualizado correctamente');
      } else {
        await empleadosApi.create(data);
        notify.success('Empleado creado correctamente');
      }
      loadEmpleados();
    } catch (error) {
      console.error('Error al guardar empleado:', error);
      handleApiError(error, selectedEmpleado ? 'Error al actualizar el empleado' : 'Error al crear el empleado');
      throw error;
    }
  };

  const formatSalario = (salario: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(salario);
  };

  const calcularTotales = () => {
    const totalEmpleados = empleados.length;
    const empleadosActivos = empleados.filter(e => e.activo).length;
    const empleadosInactivos = empleados.filter(e => !e.activo).length;
    const nominaTotal = empleados
      .filter(e => e.activo)
      .reduce((sum, e) => sum + e.salarioBase, 0);

    return { totalEmpleados, empleadosActivos, empleadosInactivos, nominaTotal };
  };

  const { totalEmpleados, empleadosActivos, empleadosInactivos, nominaTotal } = calcularTotales();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando empleados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
        <h1 className="text-4xl font-bold text-gray-900">👥 Mi Equipo de Trabajo</h1>
        <p className="text-gray-700 mt-2 text-lg">Las personas que trabajan conmigo</p>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleCreate} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          ➕ Contratar Persona
        </Button>
      </div>

      {/* Resumen de Empleados */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">👨‍👩‍👧‍👦 Total de Gente</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{totalEmpleados}</p>
              <p className="text-xs text-gray-600 mt-1">personas en total</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg shadow-md">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-lg p-6 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">✅ Trabajando Ahora</p>
              <p className="text-4xl font-bold text-green-600 mt-2">{empleadosActivos}</p>
              <p className="text-xs text-gray-600 mt-1">empleados activos</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-lg shadow-md">
              <UserCheck className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-lg p-6 border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">❌ Ya No Trabajan</p>
              <p className="text-4xl font-bold text-red-600 mt-2">{empleadosInactivos}</p>
              <p className="text-xs text-gray-600 mt-1">empleados inactivos</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-lg shadow-md">
              <UserX className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-lg p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">💰 Les Pago al Mes</p>
              <p className="text-4xl font-bold text-purple-600 mt-2">{formatSalario(nominaTotal)}</p>
              <p className="text-xs text-gray-600 mt-1">salarios totales</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-lg shadow-md">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🔍 Filtrar por Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as 'TODOS' | 'ACTIVOS' | 'INACTIVOS')}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg font-medium"
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVOS">✅ Activos</option>
                <option value="INACTIVOS">❌ Inactivos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🔎 Buscar Persona
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, DNI, cargo..."
                  className="w-full pl-10 pr-3 py-2 border-2 border-gray-300 rounded-lg font-medium"
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Empleados */}
      {filteredEmpleados.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay empleados
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No se encontraron empleados con ese criterio de búsqueda' : 'Comienza registrando tu primer empleado'}
              </p>
              {!searchTerm && (
                <Button variant="primary" onClick={handleCreate}>
                  Crear Empleado
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmpleados.map((empleado) => (
            <Card key={empleado.id}>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {empleado.nombre} {empleado.apellidos}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          empleado.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {empleado.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{empleado.dni}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Briefcase className="h-4 w-4 mr-2" />
                      <span className="font-medium">{empleado.cargo}</span>
                    </div>

                    {empleado.departamento && (
                      <div className="flex items-center text-gray-600">
                        <Building2 className="h-4 w-4 mr-2" />
                        {empleado.departamento}
                      </div>
                    )}

                    {empleado.telefono && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {empleado.telefono}
                      </div>
                    )}

                    <div className="flex items-center text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span className="font-semibold text-gray-900">
                        {formatSalario(empleado.salarioBase)}/mes
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(empleado)}
                      className="flex-1"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Editar
                    </Button>

                    {empleado.activo ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDarDeBaja(empleado.id)}
                        className="flex-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Dar de Baja
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReactivar(empleado.id)}
                        className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Reactivar
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(empleado.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <EmpleadoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        empleado={selectedEmpleado}
      />
    </div>
  );
};
