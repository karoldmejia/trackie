import { Platform } from 'react-native';

const getBaseURL = () => {
  // Si estamos en Docker (entorno de producción)
  if (process.env.NODE_ENV === 'production') {
    return process.env.EXPO_PUBLIC_API_URL || 'http://backend:3000';
  }
  
  // Desarrollo local
  if (Platform.OS === 'web') {
    // Para web con Docker, usa localhost
    return process.env.REACT_APP_API_URL || 'http://localhost:3000';
  }
  
  // Para dispositivos físicos (necesitas la IP de tu máquina)
  // Reemplaza con tu IP local
  return 'http://192.168.1.9:3000';
};

export const API_CONFIG = {
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  },
};