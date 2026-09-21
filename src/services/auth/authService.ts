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
    localStorage.removeItem('sgtr_user');
  },

  /**
   * Obtiene la información del usuario en sesión desde el almacenamiento local
   */
  getStoredUser(): AuthResponse['usuario'] | null {
    try {
      const stored = localStorage.getItem('sgtr_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /**
   * Guarda el usuario en el almacenamiento local
   */
  setStoredUser(usuario: AuthResponse['usuario']): void {
    localStorage.setItem('sgtr_user', JSON.stringify(usuario));
  },
};
