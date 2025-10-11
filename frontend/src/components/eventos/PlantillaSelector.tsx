import { FC } from 'react';
import { Calendar, Music, PartyPopper, Users, Sparkles } from 'lucide-react';

export interface EventoPlantilla {
  id: string;
  nombre: string;
  descripcion: string;
  icon: any;
  tipo: string;
  defaults: {
    capacidad?: number;
    precioEntrada?: number;
    estado?: string;
  };
}

interface PlantillaSelectorProps {
  onSelect: (plantilla: EventoPlantilla) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const PlantillaSelector: FC<PlantillaSelectorProps> = ({ onSelect, onCancel, isOpen }) => {
  if (!isOpen) return null;

  const plantillas: EventoPlantilla[] = [
    {
      id: 'fiesta-regular',
      nombre: 'Fiesta Regular',
      descripcion: 'Fiesta estándar de fin de semana',
      icon: PartyPopper,
      tipo: 'FIESTA',
      defaults: {
        capacidad: 300,
        precioEntrada: 15,
        estado: 'PLANIFICADO',
      },
    },
    {
      id: 'concierto',
      nombre: 'Concierto en Vivo',
      descripcion: 'Evento con artista o DJ en vivo',
      icon: Music,
      tipo: 'CONCIERTO',
      defaults: {
        capacidad: 250,
        precioEntrada: 25,
        estado: 'PLANIFICADO',
      },
    },
    {
      id: 'tematica',
      nombre: 'Fiesta Temática',
      descripcion: 'Halloween, Navidad, etc.',
      icon: Sparkles,
      tipo: 'TEMATICA',
      defaults: {
        capacidad: 300,
        precioEntrada: 20,
        estado: 'PLANIFICADO',
      },
    },
    {
      id: 'privado',
      nombre: 'Evento Privado',
      descripcion: 'Cumpleaños, bodas, corporativo',
      icon: Users,
      tipo: 'PRIVADO',
      defaults: {
        capacidad: 150,
        precioEntrada: 0,
        estado: 'PLANIFICADO',
      },
    },
    {
      id: 'vacio',
      nombre: 'Evento Personalizado',
      descripcion: 'Crear desde cero',
      icon: Calendar,
      tipo: 'PERSONALIZADO',
      defaults: {
        estado: 'PLANIFICADO',
      },
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <h2 className="text-2xl font-bold mb-2">Selecciona una Plantilla</h2>
          <p className="text-purple-100">Crea tu evento más rápido con configuraciones predefinidas</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plantillas.map((plantilla) => {
              const Icon = plantilla.icon;
              return (
                <button
                  key={plantilla.id}
                  onClick={() => onSelect(plantilla)}
                  className="group relative bg-white border-2 border-gray-200 hover:border-purple-500 rounded-lg p-6 text-left transition-all hover:shadow-lg"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {plantilla.nombre}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {plantilla.descripcion}
                    </p>

                    {/* Defaults preview */}
                    {Object.keys(plantilla.defaults).length > 1 && (
                      <div className="w-full bg-gray-50 rounded p-3 text-xs space-y-1">
                        {plantilla.defaults.capacidad && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Capacidad:</span>
                            <span className="font-semibold">{plantilla.defaults.capacidad}</span>
                          </div>
                        )}
                        {plantilla.defaults.precioEntrada !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Precio:</span>
                            <span className="font-semibold">
                              {plantilla.defaults.precioEntrada === 0 ? 'Gratis' : `€${plantilla.defaults.precioEntrada}`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                      Seleccionar
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
