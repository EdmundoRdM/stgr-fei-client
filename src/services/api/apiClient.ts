import axios, { AxiosError } from 'axios';
import { ENV } from '@/config/env';
import type { ApiErrorResponse } from '@/domain/models/auth.types';

export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor para inyectar automáticamente la cabecera x-numero-personal del usuario en sesión
apiClient.interceptors.request.use((config) => {
  try {
    const raw = sessionStorage.getItem('sgtr_user') || localStorage.getItem('sgtr_user');
    if (raw) {
      const user = JSON.parse(raw);
      const numPersonal = user?.numeroPersonal ?? user?.Numero_Personal;
      if (numPersonal !== undefined && numPersonal !== null && numPersonal !== '') {
        config.headers['x-numero-personal'] = String(numPersonal);
      }
    }
  } catch {
    // Si no es un JSON válido o no hay sesión, continúa sin header
  }
  return config;
});

// Response interceptor for standardized error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    let errorMessage = 'Ha ocurrido un error en el servidor. Por favor intente más tarde.';

    if (error.response?.data) {
      const data = error.response.data;
      if (data.detalle) {
        errorMessage = data.detalle;
      } else if (data.error) {
        errorMessage = data.error;
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('Network Error')) {
      errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión o el estado de la API.';
    }

    return Promise.reject(new Error(errorMessage));
  }
);
