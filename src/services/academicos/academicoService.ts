import { apiClient } from '@/services/api/apiClient';
import type { AcademicoData } from '@/domain/models/trabajo.types';

export const academicoService = {
  /**
   * Obtiene la lista completa de académicos registrados en el sistema
   */
  async getAcademicos(): Promise<AcademicoData[]> {
    const response = await apiClient.get<AcademicoData[]>('/academicos');
    return response.data;
  },
};
