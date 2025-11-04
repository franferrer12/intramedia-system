import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { agenciesAPI, estadisticasAPI } from '../services/api';
import { Music, Calendar, DollarSign, TrendingUp, Sparkles, ArrowUpRight, Award, Target } from 'lucide-react';

/**
 * 🍎 True Apple Design - Monochrome + Blue Accent
 * Paleta real de Apple: Grises, blanco, negro y azul #007AFF
 */
const AgencyDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [djs, setDJs] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const statsRes = await agenciesAPI.getStats();
      setStats(statsRes.data.data);
      const djsRes = await agenciesAPI.getDJs();
      setDJs(djsRes.data.data || []);
      const dashboardRes = await estadisticasAPI.getDashboardFinanciero(selectedYear);
      setDashboardData(dashboardRes.data.data);
    } catch (error) {
      console.error('Error cargando datos de agencia:', error);
    } finally {
      setLoading(false);
    }
  };

  const avgRevenuePerDJ = stats?.total_djs > 0 ? stats.total_revenue / stats.total_djs : 0;
  const avgEventsPerDJ = stats?.total_djs > 0 ? stats.total_events / stats.total_djs : 0;
  const commissionRate = stats?.total_revenue > 0 ? (stats.total_commission / stats.total_revenue) * 100 : 0;
  const activeDJs = djs.filter(dj => dj.activo).length;
  const monthGrowth = stats?.revenue_this_month && stats?.total_revenue
    ? ((stats.revenue_this_month / stats.total_revenue) * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        padding: '80px 48px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px', height: '280px', background: '#F5F5F7', borderRadius: '24px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: '180px', background: '#F5F5F7', borderRadius: '20px' }} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Hero Section - Apple Gray */}
      <div style={{
        background: '#1D1D1F',
        padding: '80px 48px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />

        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '64px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#007AFF'
                }} />
                <span style={{
                  fontSize: '13px',
                  color: '#A1A1A6',
                  fontWeight: '600',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}>
                  Dashboard
                </span>
              </div>
              <h1 style={{
                fontSize: '72px',
                fontWeight: '700',
                color: '#F5F5F7',
                margin: 0,
                lineHeight: '1',
                letterSpacing: '-0.025em',
                marginBottom: '16px'
              }}>
                {user?.agency?.agency_name || 'Mi Agencia'}
              </h1>
              <p style={{
                fontSize: '21px',
                color: '#A1A1A6',
                margin: 0,
                fontWeight: '400'
              }}>
                Gestión de artistas y eventos
              </p>
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{
                padding: '12px 20px',
                fontSize: '17px',
                fontWeight: '600',
                color: '#1D1D1F',
                background: '#F5F5F7',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Hero Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '48px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#86868B', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.06em' }}>
                FACTURACIÓN
              </div>
              <div style={{ fontSize: '64px', fontWeight: '700', color: '#F5F5F7', lineHeight: '1', marginBottom: '12px' }}>
                €{parseFloat(stats?.total_revenue || 0).toLocaleString('es-ES', {maximumFractionDigits: 0})}
              </div>
              <div style={{ fontSize: '17px', color: '#007AFF', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                <ArrowUpRight style={{ width: '16px', height: '16px' }} />
                +{monthGrowth}% este mes
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', color: '#86868B', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.06em' }}>
                EVENTOS
              </div>
              <div style={{ fontSize: '64px', fontWeight: '700', color: '#F5F5F7', lineHeight: '1', marginBottom: '12px' }}>
                {stats?.total_events || 0}
              </div>
              <div style={{ fontSize: '17px', color: '#86868B' }}>
                {stats?.events_this_month || 0} este mes
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', color: '#86868B', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.06em' }}>
                COMISIONES
              </div>
              <div style={{ fontSize: '64px', fontWeight: '700', color: '#F5F5F7', lineHeight: '1', marginBottom: '12px' }}>
                €{parseFloat(stats?.total_commission || 0).toLocaleString('es-ES', {maximumFractionDigits: 0})}
              </div>
              <div style={{ fontSize: '17px', color: '#86868B' }}>
                {commissionRate.toFixed(1)}% del total
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', color: '#86868B', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.06em' }}>
                ARTISTAS
              </div>
              <div style={{ fontSize: '64px', fontWeight: '700', color: '#F5F5F7', lineHeight: '1', marginBottom: '12px' }}>
                {activeDJs}
              </div>
              <div style={{ fontSize: '17px', color: '#86868B' }}>
                de {stats?.total_djs || 0} activos
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 48px' }}>

        {/* Performance Cards */}
        <div style={{ marginBottom: '96px' }}>
          <h2 style={{
            fontSize: '48px',
            fontWeight: '700',
            color: '#1D1D1F',
            margin: '0 0 16px 0',
            letterSpacing: '-0.02em'
          }}>
            Rendimiento
          </h2>
          <p style={{
            fontSize: '21px',
            color: '#6E6E73',
            margin: '0 0 48px 0'
          }}>
            Métricas clave de tu agencia
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {/* Commission */}
            <div style={{
              background: '#F5F5F7',
              borderRadius: '18px',
              padding: '32px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E8E8ED';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F5F5F7';
              e.currentTarget.style.transform = 'scale(1)';
            }}>
              <TrendingUp style={{ width: '28px', height: '28px', color: '#007AFF', marginBottom: '20px' }} />
              <div style={{ fontSize: '44px', fontWeight: '700', color: '#1D1D1F', marginBottom: '8px', lineHeight: '1' }}>
                €{parseFloat(stats?.total_commission || 0).toLocaleString('es-ES', {maximumFractionDigits: 0})}
              </div>
              <div style={{ fontSize: '17px', color: '#6E6E73', fontWeight: '600' }}>Comisiones</div>
              <div style={{ fontSize: '15px', color: '#86868B', marginTop: '8px' }}>{commissionRate.toFixed(1)}% del total</div>
            </div>

            {/* Avg per DJ */}
            <div style={{
              background: '#F5F5F7',
              borderRadius: '18px',
              padding: '32px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E8E8ED';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F5F5F7';
              e.currentTarget.style.transform = 'scale(1)';
            }}>
              <Target style={{ width: '28px', height: '28px', color: '#007AFF', marginBottom: '20px' }} />
              <div style={{ fontSize: '44px', fontWeight: '700', color: '#1D1D1F', marginBottom: '8px', lineHeight: '1' }}>
                €{avgRevenuePerDJ.toLocaleString('es-ES', {maximumFractionDigits: 0})}
              </div>
              <div style={{ fontSize: '17px', color: '#6E6E73', fontWeight: '600' }}>Promedio/DJ</div>
              <div style={{ fontSize: '15px', color: '#86868B', marginTop: '8px' }}>{avgEventsPerDJ.toFixed(1)} eventos/DJ</div>
            </div>

            {/* Avg Event */}
            <div style={{
              background: '#F5F5F7',
              borderRadius: '18px',
              padding: '32px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E8E8ED';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F5F5F7';
              e.currentTarget.style.transform = 'scale(1)';
            }}>
              <Calendar style={{ width: '28px', height: '28px', color: '#007AFF', marginBottom: '20px' }} />
              <div style={{ fontSize: '44px', fontWeight: '700', color: '#1D1D1F', marginBottom: '8px', lineHeight: '1' }}>
                €{stats?.total_events > 0 ? (stats.total_revenue / stats.total_events).toFixed(0) : 0}
              </div>
              <div style={{ fontSize: '17px', color: '#6E6E73', fontWeight: '600' }}>Precio medio</div>
              <div style={{ fontSize: '15px', color: '#86868B', marginTop: '8px' }}>Por evento</div>
            </div>

            {/* Plan */}
            <div style={{
              background: '#F5F5F7',
              borderRadius: '18px',
              padding: '32px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E8E8ED';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F5F5F7';
              e.currentTarget.style.transform = 'scale(1)';
            }}>
              <Award style={{ width: '28px', height: '28px', color: '#007AFF', marginBottom: '20px' }} />
              <div style={{ fontSize: '44px', fontWeight: '700', color: '#1D1D1F', marginBottom: '8px', lineHeight: '1', textTransform: 'capitalize' }}>
                {user?.agency?.subscription_plan || 'Básico'}
              </div>
              <div style={{ fontSize: '17px', color: '#6E6E73', fontWeight: '600' }}>Plan actual</div>
              <div style={{ fontSize: '15px', color: '#86868B', marginTop: '8px' }}>
                {stats?.total_djs || 0}/{user?.agency?.max_djs || '∞'} DJs
              </div>
            </div>
          </div>
        </div>

        {/* Artists */}
        {djs.length > 0 && (
          <div>
            <h2 style={{
              fontSize: '48px',
              fontWeight: '700',
              color: '#1D1D1F',
              margin: '0 0 16px 0',
              letterSpacing: '-0.02em'
            }}>
              Tus Artistas
            </h2>
            <p style={{
              fontSize: '21px',
              color: '#6E6E73',
              margin: '0 0 48px 0'
            }}>
              {djs.length} artistas · {activeDJs} activos
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
              {djs.map((dj, idx) => (
                <div
                  key={dj.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #D2D2D7',
                    borderRadius: '18px',
                    padding: '32px',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#007AFF';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#D2D2D7';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: '#1D1D1F',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#F5F5F7',
                        fontSize: '28px',
                        fontWeight: '700'
                      }}>
                        {dj.nombre.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '22px', fontWeight: '600', color: '#1D1D1F', marginBottom: '4px' }}>
                          {dj.nombre}
                        </div>
                        {dj.instagram_user && (
                          <div style={{ fontSize: '15px', color: '#6E6E73' }}>
                            @{dj.instagram_user}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: dj.activo ? '#34C759' : '#D2D2D7'
                    }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: '#86868B', marginBottom: '8px', fontWeight: '600', letterSpacing: '0.06em' }}>
                        EVENTOS
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#1D1D1F' }}>
                        {dj.total_events || 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#86868B', marginBottom: '8px', fontWeight: '600', letterSpacing: '0.06em' }}>
                        FACTURACIÓN
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#1D1D1F' }}>
                        €{parseFloat(dj.total_revenue || 0).toLocaleString('es-ES', {maximumFractionDigits: 0})}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#86868B', marginBottom: '8px', fontWeight: '600', letterSpacing: '0.06em' }}>
                        COMISIÓN
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: '#007AFF' }}>
                        €{parseFloat(dj.total_commission || 0).toLocaleString('es-ES', {maximumFractionDigits: 0})}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#86868B', marginBottom: '8px', fontWeight: '600', letterSpacing: '0.06em' }}>
                        PROMEDIO
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: '#6E6E73' }}>
                        €{parseFloat(dj.avg_event_price || 0).toLocaleString('es-ES', {maximumFractionDigits: 0})}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '120px',
          paddingTop: '48px',
          borderTop: '1px solid #D2D2D7',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '15px',
            color: '#86868B',
            margin: 0
          }}>
            Intra Media System · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgencyDashboard;
