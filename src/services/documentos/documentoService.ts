import { apiClient } from '@/services/api/apiClient';
import type {
  DocumentoCatalogo,
  ChecklistTrabajoResponse,
  EntregaDocumentoPayload,
  EntregasLotePayload,
} from '@/domain/models/documento.types';
import type { TrabajoRecepcional } from '@/domain/models/trabajo.types';

export const documentoService = {
  /**
   * Obtiene la lista completa de documentos del catálogo oficial de la UV
   */
  async getCatalogo(): Promise<DocumentoCatalogo[]> {
    const response = await apiClient.get<DocumentoCatalogo[]>('/documentos');
    return response.data;
  },

  /**
   * Obtiene la matriz de checklist y documentos entregados por estudiante para un trabajo específico
   */
  async getChecklistTrabajo(idTrabajo: number): Promise<ChecklistTrabajoResponse> {
    const response = await apiClient.get<ChecklistTrabajoResponse>(`/trabajos/${idTrabajo}/documentos`);
    return response.data;
  },

  /**
   * Registra la entrega de un documento individual para un estudiante y trabajo recepcional
   */
  async registrarEntrega(
    idTrabajo: number,
    payload: EntregaDocumentoPayload
  ): Promise<{ mensaje: string; registro: any }> {
    const response = await apiClient.post<{ mensaje: string; registro: any }>(
      `/trabajos/${idTrabajo}/documentos`,
      payload
    );
    return response.data;
  },

  /**
   * Revoca o elimina la entrega de un documento
   */
  async eliminarEntrega(
    idTrabajo: number,
    payload: { Matricula: string; Id_Documento: number; Numero_Personal?: string | number | null }
  ): Promise<{ mensaje: string }> {
    const response = await apiClient.delete<{ mensaje: string }>(
      `/trabajos/${idTrabajo}/documentos`,
      { data: payload }
    );
    return response.data;
  },

  /**
   * Registra entregas de múltiples documentos en lote
   */
  async registrarLote(
    idTrabajo: number,
    payload: EntregasLotePayload
  ): Promise<{ mensaje: string; totalProcesados: number }> {
    const response = await apiClient.post<{ mensaje: string; totalProcesados: number }>(
      `/trabajos/${idTrabajo}/documentos/lote`,
      payload
    );
    return response.data;
  },

  /**
   * Genera el acta oficial del trabajo recepcional (CU-06) tras cumplir el 100% de la documentación
   */
  async generarActa(
    idTrabajo: number,
    numeroPersonal?: string | number | null
  ): Promise<{ mensaje: string; trabajo: TrabajoRecepcional }> {
    const numPersonalStr = numeroPersonal !== undefined && numeroPersonal !== null ? String(numeroPersonal) : undefined;
    const response = await apiClient.post<{ mensaje: string; trabajo: TrabajoRecepcional }>(
      `/trabajos/${idTrabajo}/generar-acta`,
      { Numero_Personal: numPersonalStr },
      {
        headers: numPersonalStr ? { 'x-numero-personal': numPersonalStr } : {},
      }
    );
    return response.data;
  },
};
