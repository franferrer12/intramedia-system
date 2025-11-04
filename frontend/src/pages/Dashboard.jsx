import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { estadisticasAPI } from '../services/api';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import AgencyDashboard from './AgencyDashboard';

/**
 * Dashboard Principal - Ultra Responsive
 * Vista general completa del sistema de gestión
 */
const Dashboard = () => {
  const { user, isAgency, isIndividualDJ } = useAuth();

  // Route to appropriate dashboard
  if (isAgency()) {
    return <AgencyDashboard />;
  }

  if (isIndividualDJ()) {
    return (
      <div className="container-jobs">
        <h1 className="text-display">DJ Dashboard</h1>
        <p className="text-secondary">Panel de control para DJ Individual (próximamente)</p>
      </div>
    );
  }

  // State
  const [stats, setStats] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Responsive handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar stats simplificadas
      const statsRes = await fetch('http://localhost:3001/api/stats');
      const statsData = await statsRes.json();
      setStats(statsData.data);

      // Cargar dashboard financiero
      const dashboardRes = await estadisticasAPI.getDashboardFinanciero(selectedYear);
      setDashboardData(dashboardRes.data.data);

      // Cargar estadísticas adicionales para dashboard más completo
      const today = new Date().toISOString().split('T')[0];
      const [upcomingRes, djsRes, clientesRes] = await Promise.all([
        fetch(`http://localhost:3001/api/eventos?dateFrom=${today}&limit=100`),
        fetch('http://localhost:3001/api/djs?activo=true'),
        fetch('http://localhost:3001/api/clientes?activo=true')
      ]);

      const upcomingData = await upcomingRes.json();
      const djsData = await djsRes.json();
      const clientesData = await clientesRes.json();

      setStats(prev => ({
        ...prev,
        upcoming: upcomingData.data?.eventos?.length || upcomingData.data?.length || 0,
        activeDJs: djsData.data?.djs?.length || djsData.data?.length || 0,
        activeClients: clientesData.data?.clientes?.length || clientesData.data?.length || 0
      }));

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Loading state (Jobs-style)
  if (loading) {
    return (
      <div className="container-jobs">
        <div className="skeleton-grid">
          <div className="skeleton" style={{ height: '120px' }}></div>
          <div className="skeleton" style={{ height: '120px' }}></div>
          <div className="skeleton" style={{ height: '120px' }}></div>
        </div>
        <div className="skeleton" style={{ height: '300px', marginTop: '32px' }}></div>
      </div>
    );
  }

  // Preparar datos para gráfico
  const evolucionMensual = dashboardData?.evolucion_mensual?.map(item => ({
    mes: item.mes?.substring(0, 3) || '', // Abreviar mes (ENE, FEB, etc)
    eventos: parseInt(item.eventos) || 0,
    facturacion: parseFloat(item.facturacion) || 0
  })) || [];

  const topClientes = dashboardData?.top_clientes?.slice(0, 5) || [];

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: isMobile ? '24px 16px' : '48px 24px',
      background: '#FAFAFA',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header responsive */}
      <div style={{ marginBottom: isMobile ? '32px' : '48px' }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          marginBottom: '16px',
          gap: isMobile ? '16px' : '0'
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? '32px' : '48px',
              fontWeight: '700',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
              color: '#1D1D1F',
              marginBottom: '8px',
              margin: 0
            }}>
              Dashboard
            </h1>
            <p style={{
              fontSize: isMobile ? '15px' : '17px',
              color: '#6E6E73',
              margin: 0
            }}>
              Vista general del sistema
            </p>
          </div>

          {/* Selector de año responsive */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input"
            style={{
              width: isMobile ? '100%' : 'auto',
              fontSize: isMobile ? '15px' : '16px',
              padding: isMobile ? '12px' : '8px 12px'
            }}
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs Principales - Ultra Responsive */}
      <section style={{ marginBottom: isMobile ? '32px' : '48px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: isMobile ? '16px' : '20px',
          marginBottom: isMobile ? '32px' : '48px'
        }}>
          {/* KPI 1: Hoy */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: isMobile ? '12px' : '16px',
            padding: isMobile ? '24px' : '32px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
            }
          }}>
            <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: isMobile ? '12px' : '16px', opacity: 0.9 }}>📅</div>
            <div style={{ fontSize: isMobile ? '32px' : '40px', fontWeight: '700', color: '#1D1D1F', marginBottom: '8px', lineHeight: '1' }}>
              {stats?.today || 0}
            </div>
            <div style={{ fontSize: isMobile ? '14px' : '15px', color: '#6E6E73', fontWeight: '500' }}>Hoy</div>
          </div>

          {/* KPI 2: Este mes */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: isMobile ? '12px' : '16px',
            padding: isMobile ? '24px' : '32px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
            }
          }}>
            <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: isMobile ? '12px' : '16px', opacity: 0.9 }}>🎉</div>
            <div style={{ fontSize: isMobile ? '32px' : '40px', fontWeight: '700', color: '#1D1D1F', marginBottom: '8px', lineHeight: '1' }}>
              {stats?.events || 0}
            </div>
            <div style={{ fontSize: isMobile ? '14px' : '15px', color: '#6E6E73', fontWeight: '500' }}>Este mes</div>
          </div>

          {/* KPI 3: Ingresos */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: isMobile ? '12px' : '16px',
            padding: isMobile ? '24px' : '32px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
            }
          }}>
            <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: isMobile ? '12px' : '16px', opacity: 0.9 }}>💰</div>
            <div style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: '700', color: '#1D1D1F', marginBottom: '8px', lineHeight: '1' }}>
              €{(stats?.revenue || 0).toLocaleString('es-ES')}
            </div>
            <div style={{ fontSize: isMobile ? '14px' : '15px', color: '#6E6E73', fontWeight: '500' }}>Ingresos</div>
          </div>

          {/* KPI 4: Próximos eventos */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: isMobile ? '12px' : '16px',
            padding: isMobile ? '24px' : '32px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
            }
          }}>
            <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: isMobile ? '12px' : '16px', opacity: 0.9 }}>📆</div>
            <div style={{ fontSize: isMobile ? '32px' : '40px', fontWeight: '700', color: '#1D1D1F', marginBottom: '8px', lineHeight: '1' }}>
              {stats?.upcoming || 0}
            </div>
            <div style={{ fontSize: isMobile ? '14px' : '15px', color: '#6E6E73', fontWeight: '500' }}>Próximos</div>
          </div>
        </div>
      </section>

      {/* Estadísticas Rápidas - Responsive */}
      <section style={{ marginBottom: isMobile ? '32px' : '48px' }}>
        <h2 style={{
          fontSize: isMobile ? '24px' : '28px',
          fontWeight: '600',
          lineHeight: '1.2',
          color: '#1D1D1F',
          margin: isMobile ? '0 0 16px 0' : '0 0 20px 0'
        }}>
          Recursos Activos
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: isMobile ? '12px' : '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '12px' : '16px'
          }}>
            <div style={{
              width: isMobile ? '42px' : '48px',
              height: isMobile ? '42px' : '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '20px' : '24px',
              flexShrink: 0
            }}>🎧</div>
            <div>
              <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#1D1D1F', lineHeight: '1' }}>
                {stats?.activeDJs || 0}
              </div>
              <div style={{ fontSize: isMobile ? '12px' : '13px', color: '#6E6E73', marginTop: '4px' }}>DJs Activos</div>
            </div>
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '12px' : '16px'
          }}>
            <div style={{
              width: isMobile ? '42px' : '48px',
              height: isMobile ? '42px' : '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '20px' : '24px',
              flexShrink: 0
            }}>👥</div>
            <div>
              <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#1D1D1F', lineHeight: '1' }}>
                {stats?.activeClients || 0}
              </div>
              <div style={{ fontSize: isMobile ? '12px' : '13px', color: '#6E6E73', marginTop: '4px' }}>Clientes Activos</div>
            </div>
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '12px' : '16px'
          }}>
            <div style={{
              width: isMobile ? '42px' : '48px',
              height: isMobile ? '42px' : '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '20px' : '24px',
              flexShrink: 0
            }}>📊</div>
            <div>
              <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#1D1D1F', lineHeight: '1' }}>
                {dashboardData?.resumen?.eventos_totales || 0}
              </div>
              <div style={{ fontSize: isMobile ? '12px' : '13px', color: '#6E6E73', marginTop: '4px' }}>Eventos {selectedYear}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Gráfico de Evolución - Responsive */}
      <section style={{ marginBottom: isMobile ? '32px' : '48px' }}>
        <h2 style={{
          fontSize: isMobile ? '24px' : '32px',
          fontWeight: '600',
          lineHeight: '1.2',
          color: '#1D1D1F',
          margin: isMobile ? '0 0 16px 0' : '0 0 24px 0'
        }}>
          Evolución Mensual
        </h2>

        <div style={{
          background: '#FFFFFF',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '16px' : '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          overflowX: 'auto'
        }}>
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <LineChart data={evolucionMensual}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="mes"
                stroke="#6B7280"
                style={{ fontSize: isMobile ? '11px' : '14px' }}
              />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: isMobile ? '11px' : '14px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: isMobile ? '12px' : '14px'
                }}
              />
              <Line
                type="monotone"
                dataKey="eventos"
                stroke="#2563EB"
                strokeWidth={isMobile ? 2 : 2}
                dot={{ fill: '#2563EB', r: isMobile ? 3 : 4 }}
                activeDot={{ r: isMobile ? 5 : 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Top 5 Clientes - Responsive */}
      {topClientes.length > 0 && (
        <section style={{ marginBottom: isMobile ? '32px' : '48px' }}>
          <h2 style={{
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: '600',
            lineHeight: '1.2',
            color: '#1D1D1F',
            margin: isMobile ? '0 0 16px 0' : '0 0 24px 0'
          }}>
            Top Clientes
          </h2>

          <div style={{
            background: '#FFFFFF',
            borderRadius: isMobile ? '12px' : '16px',
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '12px' }}>
              {topClientes.map((cliente, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isMobile ? '12px' : '16px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    gap: isMobile ? '8px' : '12px'
                  }}
                  onMouseEnter={(e) => !isMobile && (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                  onMouseLeave={(e) => !isMobile && (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: isMobile ? '28px' : '32px',
                        height: isMobile ? '28px' : '32px',
                        borderRadius: '50%',
                        backgroundColor: '#2563EB',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? '12px' : '14px',
                        fontWeight: 600,
                        flexShrink: 0
                      }}
                    >
                      {idx + 1}
                    </div>
                    <span style={{
                      fontSize: isMobile ? '14px' : '15px',
                      color: '#1F2937',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {cliente.cliente_nombre}
                    </span>
                  </div>
                  <span style={{
                    fontSize: isMobile ? '15px' : '17px',
                    fontWeight: 600,
                    color: '#10B981',
                    flexShrink: 0,
                    whiteSpace: 'nowrap'
                  }}>
                    €{parseFloat(cliente.facturacion_total || 0).toLocaleString('es-ES')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Métricas Adicionales - Responsive */}
      {dashboardData?.resumen && (
        <section>
          <h2 style={{
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: '600',
            lineHeight: '1.2',
            color: '#1D1D1F',
            margin: isMobile ? '0 0 16px 0' : '0 0 24px 0'
          }}>
            Resumen del Año
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: isMobile ? '12px' : '20px'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: isMobile ? '20px' : '24px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
            }}>
              <div style={{
                fontSize: isMobile ? '24px' : '28px',
                fontWeight: '700',
                color: '#1D1D1F',
                marginBottom: '8px'
              }}>
                {dashboardData.resumen.eventos_totales || 0}
              </div>
              <div style={{
                fontSize: isMobile ? '12px' : '13px',
                color: '#6E6E73',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Eventos totales</div>
            </div>

            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: isMobile ? '20px' : '24px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
            }}>
              <div style={{
                fontSize: isMobile ? '22px' : '28px',
                fontWeight: '700',
                color: '#1D1D1F',
                marginBottom: '8px'
              }}>
                €{parseFloat(dashboardData.resumen.facturacion_total || 0).toLocaleString('es-ES')}
              </div>
              <div style={{
                fontSize: isMobile ? '12px' : '13px',
                color: '#6E6E73',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Facturación total</div>
            </div>

            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: isMobile ? '20px' : '24px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
            }}>
              <div style={{
                fontSize: isMobile ? '24px' : '28px',
                fontWeight: '700',
                color: '#1D1D1F',
                marginBottom: '8px'
              }}>
                €{parseFloat(dashboardData.resumen.bolo_promedio || 0).toFixed(0)}
              </div>
              <div style={{
                fontSize: isMobile ? '12px' : '13px',
                color: '#6E6E73',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Bolo promedio</div>
            </div>

            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: isMobile ? '20px' : '24px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
            }}>
              <div style={{
                fontSize: isMobile ? '22px' : '28px',
                fontWeight: '700',
                color: '#1D1D1F',
                marginBottom: '8px'
              }}>
                €{parseFloat(dashboardData.resumen.comision_agencia || 0).toLocaleString('es-ES')}
              </div>
              <div style={{
                fontSize: isMobile ? '12px' : '13px',
                color: '#6E6E73',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Comisión agencia</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
