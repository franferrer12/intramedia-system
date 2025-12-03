import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Package, XCircle } from 'lucide-react';
import { pedidosApi } from '../../api/pedidos.api';
import { differenceInDays, isPast, parseISO } from 'date-fns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export const AlertasPedidos = () => {
  const navigate = useNavigate();
  const { data: pedidos = [] } = useQuery({
    queryKey: ['pedidos'],
    queryFn: pedidosApi.getAll,
  });

  const alertas = useMemo(() => {
    const resultado = [];

    // Pedidos atrasados (fecha esperada pasada y aún no recibidos)
    const atrasados = pedidos.filter(p =>
      ['ENVIADO', 'CONFIRMADO', 'EN_TRANSITO'].includes(p.estado) &&
      p.fechaEsperada &&
      isPast(parseISO(p.fechaEsperada))
    );

    // Pedidos próximos a vencer (1-3 días)
    const proximosVencer = pedidos.filter(p =>
      ['ENVIADO', 'CONFIRMADO', 'EN_TRANSITO'].includes(p.estado) &&
      p.fechaEsperada &&
      !isPast(parseISO(p.fechaEsperada)) &&
      differenceInDays(parseISO(p.fechaEsperada), new Date()) <= 3
    );

    // Pedidos parciales pendientes
    const parciales = pedidos.filter(p => p.estado === 'PARCIAL');

    if (atrasados.length > 0) {
      resultado.push({
        tipo: 'error',
        icono: XCircle,
        titulo: `${atrasados.length} pedido${atrasados.length !== 1 ? 's' : ''} atrasado${atrasados.length !== 1 ? 's' : ''}`,
        descripcion: `Fecha esperada pasada sin recepcionar`,
        pedidos: atrasados,
        color: 'red'
      });
    }

    if (proximosVencer.length > 0) {
      resultado.push({
        tipo: 'warning',
        icono: Clock,
        titulo: `${proximosVencer.length} pedido${proximosVencer.length !== 1 ? 's' : ''} próximo${proximosVencer.length !== 1 ? 's' : ''} a llegar`,
        descripcion: `Llegan en los próximos 3 días`,
        pedidos: proximosVencer,
        color: 'yellow'
      });
    }

    if (parciales.length > 0) {
      resultado.push({
        tipo: 'info',
        icono: Package,
        titulo: `${parciales.length} recepción${parciales.length !== 1 ? 'es' : ''} parcial${parciales.length !== 1 ? 'es' : ''}`,
        descripcion: `Pendiente${parciales.length !== 1 ? 's' : ''} de completar`,
        pedidos: parciales,
        color: 'blue'
      });
    }

    return resultado;
  }, [pedidos]);

  if (alertas.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {alertas.map((alerta, index) => {
        const Icon = alerta.icono;
        const colorClasses = {
          red: 'bg-red-50 border-red-200 text-red-800',
          yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          blue: 'bg-blue-50 border-blue-200 text-blue-800',
        };

        const iconColors = {
          red: 'text-red-600',
          yellow: 'text-yellow-600',
          blue: 'text-blue-600',
        };

        return (
          <div key={index} className={`border rounded-lg p-4 ${colorClasses[alerta.color as keyof typeof colorClasses]}`}>
            <div className="flex items-start gap-3">
              <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconColors[alerta.color as keyof typeof iconColors]}`} />
              <div className="flex-1">
                <h4 className="font-medium">{alerta.titulo}</h4>
                <p className="text-sm mt-1 opacity-90">{alerta.descripcion}</p>

                {/* Lista de pedidos */}
                <div className="mt-3 space-y-2">
                  {alerta.pedidos.slice(0, 3).map((pedido) => (
                    <div
                      key={pedido.id}
                      onClick={() => navigate('/pedidos')}
                      className="bg-white bg-opacity-60 rounded px-3 py-2 text-sm flex items-center justify-between cursor-pointer hover:bg-opacity-100 transition-all"
                    >
                      <div>
                        <span className="font-medium">{pedido.numeroPedido}</span>
                        <span className="text-gray-600 mx-2">•</span>
                        <span>{pedido.proveedorNombre}</span>
                      </div>
                      {pedido.fechaEsperada && (
                        <span className="text-xs">
                          {format(parseISO(pedido.fechaEsperada), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      )}
                    </div>
                  ))}
                  {alerta.pedidos.length > 3 && (
                    <button
                      onClick={() => navigate('/pedidos')}
                      className="text-sm font-medium hover:underline"
                    >
                      Ver {alerta.pedidos.length - 3} más...
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
