import { useState } from 'react';
import { Settings, Users, FileText, Activity } from 'lucide-react';
import SystemLogsTab from '../../components/admin/SystemLogsTab';
import ConfiguracionTab from '../../components/admin/ConfiguracionTab';
import UsuariosTab from '../../components/admin/UsuariosTab';
import SystemHealthTab from '../../components/admin/SystemHealthTab';

type TabType = 'logs' | 'config' | 'users' | 'health';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('logs');

  const tabs = [
    { id: 'logs' as TabType, label: 'Logs del Sistema', icon: FileText },
    { id: 'config' as TabType, label: 'Configuración', icon: Settings },
    { id: 'users' as TabType, label: 'Usuarios', icon: Users },
    { id: 'health' as TabType, label: 'Estado del Sistema', icon: Activity },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-600 mt-2">
          Gestión de usuarios, configuración del sistema y monitoreo de logs
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium
                  ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'logs' && <SystemLogsTab />}
        {activeTab === 'config' && <ConfiguracionTab />}
        {activeTab === 'users' && <UsuariosTab />}
        {activeTab === 'health' && <SystemHealthTab />}
      </div>
    </div>
  );
}
