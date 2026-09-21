import { apiClient } from '@/services/api/apiClient';
import type { EstudianteData } from '@/domain/models/trabajo.types';

export const estudianteService = {
  /**
   * Obtiene la lista completa de estudiantes registrados en el sistema
   */
  async getEstudiantes(): Promise<EstudianteData[]> {
    const response = await apiClient.get<EstudianteData[]>('/estudiantes');
    return response.data;
  },
};
