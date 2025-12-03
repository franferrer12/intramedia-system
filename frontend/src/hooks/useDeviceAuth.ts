import { useState, useEffect } from 'react';
import { dispositivosPosApi, AuthDispositivoResponse, ConfiguracionPOS } from '../api/dispositivos-pos.api';

const DEVICE_UUID_KEY = 'device_uuid';
const DEVICE_TOKEN_KEY = 'device_token';
const DEVICE_DATA_KEY = 'device_data';
const DEVICE_CONFIG_KEY = 'device_config';
const DEVICE_TOKEN_EXPIRES_KEY = 'device_token_expires_at';
const DEVICE_CONFIG_LAST_UPDATE_KEY = 'device_config_last_update';

export interface DeviceAuthState {
  isAuthenticated: boolean;
  deviceUuid: string | null;
  deviceToken: string | null;
  deviceData: AuthDispositivoResponse['dispositivo'] | null;
  deviceConfig: ConfiguracionPOS | null;
  isLoading: boolean;
  error: string | null;
  tokenExpiresAt: number | null;
}

export const useDeviceAuth = () => {
  const [state, setState] = useState<DeviceAuthState>({
    isAuthenticated: false,
    deviceUuid: null,
    deviceToken: null,
    deviceData: null,
    deviceConfig: null,
    isLoading: true,
    error: null,
    tokenExpiresAt: null,
  });

  // Cargar datos del dispositivo desde localStorage al inicio
  useEffect(() => {
    const loadDeviceData = async () => {
      try {
        const uuid = localStorage.getItem(DEVICE_UUID_KEY);
        const token = localStorage.getItem(DEVICE_TOKEN_KEY);
        const dataStr = localStorage.getItem(DEVICE_DATA_KEY);
        const configStr = localStorage.getItem(DEVICE_CONFIG_KEY);
        const expiresAtStr = localStorage.getItem(DEVICE_TOKEN_EXPIRES_KEY);

        // Verificar expiración del token
        if (expiresAtStr) {
          const expiresAt = parseInt(expiresAtStr);
          if (Date.now() >= expiresAt) {
            console.warn('⚠️ Token de dispositivo expirado. Requiere nuevo login.');
            // Limpiar datos expirados
            localStorage.removeItem(DEVICE_TOKEN_KEY);
            localStorage.removeItem(DEVICE_DATA_KEY);
            localStorage.removeItem(DEVICE_CONFIG_KEY);
            localStorage.removeItem(DEVICE_TOKEN_EXPIRES_KEY);
            localStorage.removeItem(DEVICE_CONFIG_LAST_UPDATE_KEY);
            setState(prev => ({ ...prev, isLoading: false }));
            return;
          }
        }

        if (uuid && token && dataStr && configStr) {
          const deviceData = JSON.parse(dataStr);
          let deviceConfig = JSON.parse(configStr);

          // ✅ FIX: Si la configuración no tiene productos, recargarla desde el API
          if (!deviceConfig.productosPrecargados || deviceConfig.productosPrecargados.length === 0) {
            const lastUpdateStr = localStorage.getItem(DEVICE_CONFIG_LAST_UPDATE_KEY);
            const lastUpdate = lastUpdateStr ? parseInt(lastUpdateStr) : 0;
            const oneHourAgo = Date.now() - (60 * 60 * 1000);

            // Solo recargar si han pasado más de 1 hora desde la última actualización
            if (lastUpdate < oneHourAgo) {
              console.log('⚠️ Configuración sin productos detectada. Recargando desde API...');
              try {
                const fullConfig = await dispositivosPosApi.obtenerConfiguracion(deviceData.id);
                deviceConfig = fullConfig;
                // Actualizar localStorage con la configuración completa y timestamp
                localStorage.setItem(DEVICE_CONFIG_KEY, JSON.stringify(fullConfig));
                localStorage.setItem(DEVICE_CONFIG_LAST_UPDATE_KEY, Date.now().toString());
                console.log('✅ Configuración recargada:', fullConfig.productosPrecargados?.length || 0, 'productos');
              } catch (error) {
                console.error('❌ Error recargando configuración:', error);
                // Continuar con la configuración existente aunque esté incompleta
              }
            } else {
              console.log('ℹ️ Configuración cacheada reciente (menos de 1 hora), omitiendo recarga');
            }
          }

          setState({
            isAuthenticated: true,
            deviceUuid: uuid,
            deviceToken: token,
            deviceData,
            deviceConfig,
            isLoading: false,
            error: null,
            tokenExpiresAt: expiresAtStr ? parseInt(expiresAtStr) : null,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading device data:', error);
        setState(prev => ({ ...prev, isLoading: false, error: 'Error al cargar datos del dispositivo' }));
      }
    };

    loadDeviceData();
  }, []);

  const login = async (uuid: string, pin: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await dispositivosPosApi.autenticarConPIN(uuid, pin);

      // Calcular timestamp de expiración (30 días para tokens de dispositivo)
      const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);

      // Guardar en localStorage
      localStorage.setItem(DEVICE_UUID_KEY, uuid);
      localStorage.setItem(DEVICE_TOKEN_KEY, response.token);
      localStorage.setItem(DEVICE_DATA_KEY, JSON.stringify(response.dispositivo));
      localStorage.setItem(DEVICE_CONFIG_KEY, JSON.stringify(response.configuracion));
      localStorage.setItem(DEVICE_TOKEN_EXPIRES_KEY, expiresAt.toString());
      localStorage.setItem(DEVICE_CONFIG_LAST_UPDATE_KEY, Date.now().toString());

      setState({
        isAuthenticated: true,
        deviceUuid: uuid,
        deviceToken: response.token,
        deviceData: response.dispositivo,
        deviceConfig: response.configuracion,
        isLoading: false,
        error: null,
        tokenExpiresAt: expiresAt,
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'PIN incorrecto o dispositivo no encontrado';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(DEVICE_UUID_KEY);
    localStorage.removeItem(DEVICE_TOKEN_KEY);
    localStorage.removeItem(DEVICE_DATA_KEY);
    localStorage.removeItem(DEVICE_CONFIG_KEY);
    localStorage.removeItem(DEVICE_TOKEN_EXPIRES_KEY);
    localStorage.removeItem(DEVICE_CONFIG_LAST_UPDATE_KEY);

    setState({
      isAuthenticated: false,
      deviceUuid: null,
      deviceToken: null,
      deviceData: null,
      deviceConfig: null,
      isLoading: false,
      error: null,
      tokenExpiresAt: null,
    });
  };

  const setDeviceUuid = (uuid: string) => {
    localStorage.setItem(DEVICE_UUID_KEY, uuid);
    setState(prev => ({ ...prev, deviceUuid: uuid }));
  };

  const refreshConfig = async () => {
    if (!state.deviceData?.id) return;

    try {
      const config = await dispositivosPosApi.obtenerConfiguracion(state.deviceData.id);
      localStorage.setItem(DEVICE_CONFIG_KEY, JSON.stringify(config));
      localStorage.setItem(DEVICE_CONFIG_LAST_UPDATE_KEY, Date.now().toString());
      setState(prev => ({ ...prev, deviceConfig: config }));
    } catch (error) {
      console.error('Error refreshing config:', error);
    }
  };

  const sendHeartbeat = async () => {
    if (!state.deviceData?.id) return;

    try {
      await dispositivosPosApi.registrarHeartbeat(state.deviceData.id);
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  };

  return {
    ...state,
    login,
    logout,
    setDeviceUuid,
    refreshConfig,
    sendHeartbeat,
  };
};
