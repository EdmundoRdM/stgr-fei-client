import { apiClient } from '@/services/api/apiClient';
import type { LoginCredentials, AuthResponse } from '@/domain/models/auth.types';

export const authService = {
  /**
   * Autentica a un usuario docente o administrativo contra el backend de SGTR-FEI
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Cierra la sesión activa en el cliente
   */
  logout(): void {
    sessionStorage.removeItem('sgtr_user');
    localStorage.removeItem('sgtr_user');
  },

  /**
   * Obtiene la información del usuario en sesión desde sessionStorage
   */
  getStoredUser(): AuthResponse['usuario'] | null {
    try {
      // Limpiar remanente previo en localStorage si existe para evitar auto-logins no deseados
      if (localStorage.getItem('sgtr_user')) {
        localStorage.removeItem('sgtr_user');
      }
      const stored = sessionStorage.getItem('sgtr_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /**
   * Guarda el usuario en el almacenamiento de sesión (sessionStorage)
   */
  setStoredUser(usuario: AuthResponse['usuario']): void {
    sessionStorage.setItem('sgtr_user', JSON.stringify(usuario));
    localStorage.removeItem('sgtr_user');
  },
};
