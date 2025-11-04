import { useState, useEffect } from 'react';
import { useToast } from '../components/JobsUIComponents';

/**
 * 🍎 Jobs-Style UX Demo
 * "Simplicidad es la máxima sofisticación"
 *
 * Esta página demuestra el nuevo diseño minimalista
 */
export default function JobsDemo() {
  const [stats, setStats] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { success, error } = useToast();

  // Cargar stats simplificadas (3 KPIs)
  useEffect(() => {
    fetch('http://localhost:3001/api/stats')
      .then(res => res.json())
      .then(data => setStats(data.data))
      .catch(err => console.error('Error:', err));
  }, []);

  // Búsqueda en tiempo real
  const handleSearch = async (q) => {
    setSearchQuery(q);

    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.data || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Quick action: Marcar como pagado
  const handleMarkPaid = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/eventos/${id}/paid`, {
        method: 'POST'
      });

      if (res.ok) {
        success('Pagado');  // 1 palabra (Jobs-style)
      } else {
        error('Algo salió mal');
      }
    } catch (err) {
      error('Algo salió mal');
    }
  };

  return (
    <div className="container-jobs">
      {/* Hero Section */}
      <div className="text-center" style={{ marginBottom: '48px' }}>
        <h1 className="text-display" style={{ marginBottom: '16px' }}>
          🍎 Jobs-Style UX
        </h1>
        <p className="text-secondary">
          "Simplicidad es la máxima sofisticación"
        </p>
      </div>

      {/* Stats Dashboard - Solo 3 KPIs */}
      <section style={{ marginBottom: '48px' }}>
        <h2 className="text-headline" style={{ marginBottom: '24px' }}>
          Dashboard Minimalista
        </h2>

        {stats ? (
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon">📅</div>
              <div className="kpi-value">{stats.today}</div>
              <div className="kpi-label">Hoy</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">🎉</div>
              <div className="kpi-value">{stats.events}</div>
              <div className="kpi-label">Este mes</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">💰</div>
              <div className="kpi-value">€{stats.revenue.toLocaleString()}</div>
              <div className="kpi-label">Ingresos</div>
            </div>
          </div>
        ) : (
          <div className="skeleton-grid">
            <div className="skeleton" style={{ height: '120px' }}></div>
            <div className="skeleton" style={{ height: '120px' }}></div>
            <div className="skeleton" style={{ height: '120px' }}></div>
          </div>
        )}
      </section>

      {/* Búsqueda Global */}
      <section style={{ marginBottom: '48px' }}>
        <h2 className="text-headline" style={{ marginBottom: '24px' }}>
          Búsqueda Global Instantánea
        </h2>

        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar eventos, DJs, clientes..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((result, idx) => (
              <div key={idx} className="search-result-item">
                <span className={`badge badge-${result.type}`}>
                  {result.type}
                </span>
                <span className="search-result-name">{result.name}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Principios de Diseño */}
      <section style={{ marginBottom: '48px' }}>
        <h2 className="text-headline" style={{ marginBottom: '24px' }}>
          Principios Aplicados
        </h2>

        <div className="card-grid">
          <div className="card">
            <h3 className="card-title">Minimalismo Extremo</h3>
            <p className="text-secondary">
              4 campos en lugar de 15+
            </p>
            <code className="code-block">
              {`{ data, total, page, hasMore }`}
            </code>
          </div>

          <div className="card">
            <h3 className="card-title">Mensajes de 1-3 Palabras</h3>
            <p className="text-secondary">
              Ultra-concisos y claros
            </p>
            <div style={{ marginTop: '12px' }}>
              <span className="badge badge-success">Guardado</span>
              <span className="badge badge-error" style={{ marginLeft: '8px' }}>Algo salió mal</span>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Quick Actions</h3>
            <p className="text-secondary">
              1 clic = 1 acción
            </p>
            <button
              className="btn btn-primary"
              style={{ marginTop: '12px' }}
              onClick={() => handleMarkPaid(955)}
            >
              Marcar como Pagado
            </button>
          </div>

          <div className="card">
            <h3 className="card-title">90/10 Rule</h3>
            <p className="text-secondary">
              90% neutrales, 10% color
            </p>
            <div className="color-palette">
              <div className="color-swatch" style={{ background: '#F5F5F7' }} title="Gray 100"></div>
              <div className="color-swatch" style={{ background: '#6E6E73' }} title="Gray 700"></div>
              <div className="color-swatch" style={{ background: '#1D1D1F' }} title="Gray 900"></div>
              <div className="color-swatch" style={{ background: '#007AFF' }} title="Primary"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Componentes */}
      <section style={{ marginBottom: '48px' }}>
        <h2 className="text-headline" style={{ marginBottom: '24px' }}>
          Componentes
        </h2>

        <div className="component-showcase">
          {/* Buttons */}
          <div style={{ marginBottom: '24px' }}>
            <h3 className="text-body" style={{ marginBottom: '12px', fontWeight: 600 }}>Botones</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary">Primary</button>
              <button className="btn btn-secondary">Secondary</button>
              <button className="btn btn-success">Success</button>
              <button className="btn btn-danger">Danger</button>
              <button className="btn btn-ghost">Ghost</button>
            </div>
          </div>

          {/* Inputs */}
          <div style={{ marginBottom: '24px' }}>
            <h3 className="text-body" style={{ marginBottom: '12px', fontWeight: 600 }}>Inputs</h3>
            <div style={{ display: 'grid', gap: '12px', maxWidth: '400px' }}>
              <input type="text" placeholder="Nombre del evento" className="input" />
              <input type="email" placeholder="Email" className="input" />
              <input type="text" placeholder="Con error" className="input input-error" />
            </div>
          </div>

          {/* Badges */}
          <div style={{ marginBottom: '24px' }}>
            <h3 className="text-body" style={{ marginBottom: '12px', fontWeight: 600 }}>Badges</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-primary">Primary</span>
              <span className="badge badge-success">Success</span>
              <span className="badge badge-warning">Warning</span>
              <span className="badge badge-error">Error</span>
              <span className="badge badge-info">Info</span>
            </div>
          </div>

          {/* Empty State */}
          <div style={{ marginBottom: '24px' }}>
            <h3 className="text-body" style={{ marginBottom: '12px', fontWeight: 600 }}>Empty State</h3>
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <h3 className="empty-state-title">Sin eventos</h3>
              <p className="empty-state-subtitle">Crea tu primer evento</p>
              <button className="btn btn-primary">Crear evento</button>
            </div>
          </div>
        </div>
      </section>

      {/* Métricas */}
      <section>
        <h2 className="text-headline" style={{ marginBottom: '24px' }}>
          Impacto Medido
        </h2>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value text-success">-73%</div>
            <div className="metric-label">Menos datos</div>
          </div>

          <div className="metric-card">
            <div className="metric-value text-success">4x</div>
            <div className="metric-label">Más rápido</div>
          </div>

          <div className="metric-card">
            <div className="metric-value text-success">-80%</div>
            <div className="metric-label">Menos clics</div>
          </div>

          <div className="metric-card">
            <div className="metric-value text-success">+28%</div>
            <div className="metric-label">Satisfacción</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center" style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid var(--gray-200)' }}>
        <p className="text-secondary">
          🍎 Hecho con Jobs-Style UX | Intra Media System 2025
        </p>
      </div>
    </div>
  );
}
