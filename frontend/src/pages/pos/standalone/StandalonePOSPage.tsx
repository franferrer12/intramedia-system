import { FC } from 'react';
import { useDeviceAuth } from '../../../hooks/useDeviceAuth';
import { useHeartbeat } from '../../../hooks/useHeartbeat';
import { POSStandaloneLogin } from './POSStandaloneLogin';
import { POSStandaloneTerminal } from './POSStandaloneTerminal';

export const StandalonePOSPage: FC = () => {
  const {
    isAuthenticated,
    deviceUuid,
    deviceToken,
    deviceData,
    deviceConfig,
    isLoading,
    error,
    login,
    logout,
    setDeviceUuid,
  } = useDeviceAuth();

  // Hook de heartbeat - envía pings cada 30 segundos cuando está autenticado
  useHeartbeat(
    deviceData?.id || 0,
    isAuthenticated && !!deviceData,
    30000 // 30 segundos
  );

  // Mostrar loader inicial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando Terminal POS...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return (
      <POSStandaloneLogin
        deviceUuid={deviceUuid}
        onLogin={login}
        isLoading={isLoading}
        error={error}
        onSetDeviceUuid={setDeviceUuid}
      />
    );
  }

  // Si está autenticado, mostrar terminal
  return (
    <POSStandaloneTerminal
      dispositivo={deviceData!}
      configuracion={deviceConfig!}
      token={deviceToken!}
      onLogout={logout}
    />
  );
};
