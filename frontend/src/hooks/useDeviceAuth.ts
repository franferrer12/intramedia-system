import { useState, useEffect } from 'react';
import { dispositivosPosApi, AuthDispositivoResponse, ConfiguracionPOS } from '../api/dispositivos-pos.api';

const DEVICE_UUID_KEY = 'device_uuid';
const DEVICE_TOKEN_KEY = 'device_token';
const DEVICE_DATA_KEY = 'device_data';
const DEVICE_CONFIG_KEY = 'device_config';

export interface DeviceAuthState {
  isAuthenticated: boolean;
  deviceUuid: string | null;
  deviceToken: string | null;
  deviceData: AuthDispositivoResponse['dispositivo'] | null;
  deviceConfig: ConfiguracionPOS | null;
  isLoading: boolean;
  error: string | null;
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
  });

  // Cargar datos del dispositivo desde localStorage al inicio
  useEffect(() => {
    const loadDeviceData = () => {
      try {
        const uuid = localStorage.getItem(DEVICE_UUID_KEY);
        const token = localStorage.getItem(DEVICE_TOKEN_KEY);
        const dataStr = localStorage.getItem(DEVICE_DATA_KEY);
        const configStr = localStorage.getItem(DEVICE_CONFIG_KEY);

        if (uuid && token && dataStr && configStr) {
          setState({
            isAuthenticated: true,
            deviceUuid: uuid,
            deviceToken: token,
            deviceData: JSON.parse(dataStr),
            deviceConfig: JSON.parse(configStr),
            isLoading: false,
            error: null,
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

      // Guardar en localStorage
      localStorage.setItem(DEVICE_UUID_KEY, uuid);
      localStorage.setItem(DEVICE_TOKEN_KEY, response.token);
      localStorage.setItem(DEVICE_DATA_KEY, JSON.stringify(response.dispositivo));
      localStorage.setItem(DEVICE_CONFIG_KEY, JSON.stringify(response.configuracion));

      setState({
        isAuthenticated: true,
        deviceUuid: uuid,
        deviceToken: response.token,
        deviceData: response.dispositivo,
        deviceConfig: response.configuracion,
        isLoading: false,
        error: null,
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

    setState({
      isAuthenticated: false,
      deviceUuid: null,
      deviceToken: null,
      deviceData: null,
      deviceConfig: null,
      isLoading: false,
      error: null,
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
