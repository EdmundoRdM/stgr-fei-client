import { apiClient } from '@/services/api/apiClient';
import type { TrabajoRecepcional, ParticipantesTrabajoResponse } from '@/domain/models/trabajo.types';
import { documentoService } from '@/services/documentos/documentoService';

export interface GuardarTrabajoPayload {
  Titulo: string;
  Modalidad: string;
  Fecha_defensa?: string;
  Id_Carrera?: number;
  Id_Lugar?: number;
  Folio?: string;
  Resultado?: string;
  participantes?: Array<{
    Numero_Personal: string | number;
    Id_rol: number;
  }>;
  matriculasEstudiantes?: string[];
}

export const trabajoService = {
  /**
   * Obtiene los participantes (profesores y estudiantes) asignados a un trabajo específico
   */
  async getParticipantesByTrabajo(idTrabajo: number): Promise<ParticipantesTrabajoResponse> {
    try {
      const response = await apiClient.get<ParticipantesTrabajoResponse>(`/participantes/trabajo/${idTrabajo}`);
      return response.data;
    } catch {
      return { Id_TrabajoR: idTrabajo, academicos: [], estudiantes: [] };
    }
  },

  /**
   * Obtiene la lista de trabajos recepcionales integrando sus profesores y estudiantes desde la API
   */
  async getTrabajos(filtros?: {
    Id_Carrera?: number;
    Id_Estado?: number;
    Modalidad?: string;
  }): Promise<TrabajoRecepcional[]> {
    const response = await apiClient.get<TrabajoRecepcional[]>('/trabajos', {
      params: filtros,
    });
    const listaTrabajos = response.data;

    // Traer los participantes (profesores y alumnos) y checklist para cada trabajo en paralelo
    const trabajosCompletos = await Promise.all(
      listaTrabajos.map(async (trabajo) => {
        try {
          const partData = await trabajoService.getParticipantesByTrabajo(trabajo.Id_TrabajoR);
          let checklistCompleto = false;
          if (trabajo.EstadoListum?.EstadoNombre === 'Aprobado') {
            try {
              const checkData = await documentoService.getChecklistTrabajo(trabajo.Id_TrabajoR);
              checklistCompleto = checkData.checklistCompleto;
            } catch {}
          }
          return {
            ...trabajo,
            academicos: partData.academicos || [],
            estudiantes: partData.estudiantes || [],
            checklistCompleto,
          };
        } catch {
          return {
            ...trabajo,
            academicos: [],
            estudiantes: [],
            checklistCompleto: false,
          };
        }
      })
    );

    return trabajosCompletos;
  },

  /**
   * Obtiene el detalle completo de un trabajo recepcional
   */
  async getTrabajoById(id: number): Promise<TrabajoRecepcional> {
    const response = await apiClient.get<TrabajoRecepcional>(`/trabajos/${id}`);
    const partData = await trabajoService.getParticipantesByTrabajo(id);
    return {
      ...response.data,
      academicos: partData.academicos || [],
      estudiantes: partData.estudiantes || [],
    };
  },

  /**
   * Crea un nuevo trabajo recepcional en estado Borrador y vincula sus participantes y estudiantes
   */
  async crearTrabajo(payload: GuardarTrabajoPayload): Promise<TrabajoRecepcional> {
    const { participantes = [], matriculasEstudiantes = [], ...datosTrabajo } = payload;
    
    // 1. Crear el trabajo recepcional
    const response = await apiClient.post<TrabajoRecepcional>('/trabajos', datosTrabajo);
    const nuevoTrabajo = response.data;
    const idTrabajo = nuevoTrabajo.Id_TrabajoR;

    // 2. Asignar los profesores participantes
    for (const part of participantes) {
      if (part.Numero_Personal && part.Id_rol) {
        try {
          await apiClient.post('/participantes/academico', {
            Id_TrabajoR: idTrabajo,
            Numero_Personal: part.Numero_Personal,
            Id_rol: part.Id_rol,
          });
        } catch (e) {
          console.error('Error al asignar académico:', e);
        }
      }
    }

    // 3. Asignar la lista de estudiantes
    for (const matricula of matriculasEstudiantes) {
      if (matricula) {
        try {
          await apiClient.post('/participantes/estudiante', {
            Id_TrabajoR: idTrabajo,
            Matricula: matricula,
          });
        } catch (e) {
          console.error('Error al asignar estudiante:', e);
        }
      }
    }

    return nuevoTrabajo;
  },

  /**
   * Actualiza la información de un trabajo recepcional y sincroniza participantes y estudiantes
   */
  async actualizarTrabajo(
    id: number,
    payload: GuardarTrabajoPayload
  ): Promise<TrabajoRecepcional> {
    const { participantes = [], matriculasEstudiantes = [], ...datosTrabajo } = payload;

    // 1. Actualizar datos base del trabajo
    const response = await apiClient.put<{ mensaje: string; trabajo: TrabajoRecepcional }>(
      `/trabajos/${id}`,
      datosTrabajo
    );

    // 2. Obtener asignaciones actuales para actualizar
    const actuales = await trabajoService.getParticipantesByTrabajo(id);

    // Limpiar asignaciones previas de académicos
    for (const p of actuales.academicos || []) {
      if (p.Id_Participacion) {
        try {
          await apiClient.delete(`/participantes/academico/${p.Id_Participacion}`);
        } catch {}
      }
    }

    // Registrar nuevos participantes
    for (const part of participantes) {
      if (part.Numero_Personal && part.Id_rol) {
        try {
          await apiClient.post('/participantes/academico', {
            Id_TrabajoR: id,
            Numero_Personal: part.Numero_Personal,
            Id_rol: part.Id_rol,
          });
        } catch (e) {
          console.error('Error al reasignar académico:', e);
        }
      }
    }

    // Limpiar estudiantes previos y registrar la nueva lista
    for (const est of actuales.estudiantes || []) {
      if (est.Id_EstudianteTrabajo) {
        try {
          await apiClient.delete(`/participantes/estudiante/${est.Id_EstudianteTrabajo}`);
        } catch {}
      }
    }

    for (const matricula of matriculasEstudiantes) {
      if (matricula) {
        try {
          await apiClient.post('/participantes/estudiante', {
            Id_TrabajoR: id,
            Matricula: matricula,
          });
        } catch (e) {
          console.error('Error al reasignar estudiante:', e);
        }
      }
    }

    return response.data.trabajo;
  },

  /**
   * Envía un trabajo en borrador a validación (CU-02) -> cambia a 'Registrado'
   */
  async enviarAValidacion(id: number): Promise<TrabajoRecepcional> {
    const response = await apiClient.post<TrabajoRecepcional>(`/trabajos/${id}/enviar`);
    return response.data;
  },

  /**
   * Elimina un registro de trabajo recepcional en estado Borrador (FA-03)
   */
  async eliminarTrabajo(id: number): Promise<{ mensaje: string }> {
    const response = await apiClient.delete<{ mensaje: string }>(`/trabajos/${id}`);
    return response.data;
  },

  /**
   * Valida y aprueba un trabajo recepcional en estado Registrado (CU-03) -> cambia a 'Aprobado'
   */
  async validarTrabajo(id: number): Promise<TrabajoRecepcional> {
    const response = await apiClient.post<{ mensaje: string; trabajo: TrabajoRecepcional }>(
      `/trabajos/${id}/validar`
    );
    return response.data.trabajo;
  },

  /**
   * Rechaza un trabajo recepcional en estado Registrado (CU-04) -> regresa a 'Borrador'
   */
  async rechazarTrabajo(
    id: number,
    motivo?: string
  ): Promise<{ mensaje: string; motivo: string; trabajo: TrabajoRecepcional }> {
    const response = await apiClient.post<{
      mensaje: string;
      motivo: string;
      trabajo: TrabajoRecepcional;
    }>(`/trabajos/${id}/rechazar`, {
      motivo: motivo || 'Corrección solicitada por Directivo',
    });
    return response.data;
  },

  /**
   * Finaliza un trabajo recepcional en estado Generado asignando Folio y Resultado
   * -> cambia a 'Finalizado' (Id_Estado = 5)
   */
  async finalizarTrabajo(
    id: number,
    payload: { Folio: string; Resultado: string; Numero_Personal?: string | number | null }
  ): Promise<{ mensaje: string; trabajo: TrabajoRecepcional }> {
    const numPersonalStr =
      payload.Numero_Personal !== undefined && payload.Numero_Personal !== null
        ? String(payload.Numero_Personal)
        : undefined;
    const response = await apiClient.post<{ mensaje: string; trabajo: TrabajoRecepcional }>(
      `/trabajos/${id}/finalizar`,
      {
        Folio: payload.Folio,
        Resultado: payload.Resultado,
        Numero_Personal: numPersonalStr,
      },
      {
        headers: numPersonalStr ? { 'x-numero-personal': numPersonalStr } : {},
      }
    );
    return response.data;
  },
};
