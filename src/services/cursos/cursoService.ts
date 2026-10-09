import { apiClient } from '@/services/api/apiClient';
import type {
  GrupoProfesor,
  PeriodoEscolar,
  CursoER,
  DetalleCursoER,
  EstudianteCurso,
  AsignarProfesorPayload,
  InscribirEstudiantePayload,
  InscribirLotePayload,
} from '@/domain/models/curso.types';

export const cursoService = {
  /**
   * Obtiene los grupos de Experiencia Recepcional asignados al profesor autenticado.
   * Por defecto puede filtrar solo por el periodo escolar activo (soloActual: true).
   */
  async getMisGrupos(options?: {
    soloActual?: boolean;
    numeroPersonal?: string | number;
  }): Promise<GrupoProfesor[]> {
    const params: Record<string, any> = {};
    if (options?.soloActual !== undefined) {
      params.soloActual = options.soloActual;
    }
    if (options?.numeroPersonal) {
      params.Numero_Personal = options.numeroPersonal;
    }

    const response = await apiClient.get<GrupoProfesor[]>('/cursos/mis-grupos', {
      params,
    });
    return response.data || [];
  },

  /**
   * Consulta el periodo escolar actualmente vigente.
   */
  async getPeriodoActual(): Promise<PeriodoEscolar | null> {
    try {
      const response = await apiClient.get<PeriodoEscolar>('/cursos/periodo-actual');
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * Lista todos los periodos escolares registrados en el sistema.
   */
  async getPeriodos(): Promise<PeriodoEscolar[]> {
    try {
      const response = await apiClient.get<PeriodoEscolar[]>('/cursos/periodos');
      return response.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Lista todos los cursos/NRCs de Experiencia Recepcional registrados.
   */
  async getCursos(): Promise<CursoER[]> {
    try {
      const response = await apiClient.get<CursoER[]>('/cursos');
      return response.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Registra un nuevo curso/NRC de Experiencia Recepcional.
   * POST /api/cursos
   */
  async crearCurso(curso: { NRC: string; Nombre: string }): Promise<CursoER> {
    const response = await apiClient.post<CursoER>('/cursos', curso);
    return response.data;
  },

  /**
   * Detalle de un curso con profesores y estudiantes asignados.
   * GET /api/cursos/:id
   */
  async getCursoById(id: number): Promise<DetalleCursoER> {
    const response = await apiClient.get<DetalleCursoER>(`/cursos/${id}`);
    return response.data;
  },

  /**
   * Asigna a un profesor como titular de un NRC en un periodo escolar.
   * POST /api/cursos/asignar-profesor
   */
  async asignarProfesor(data: AsignarProfesorPayload): Promise<{ mensaje: string; asignacion?: any }> {
    const response = await apiClient.post<{ mensaje: string; asignacion?: any }>(
      '/cursos/asignar-profesor',
      data
    );
    return response.data;
  },

  /**
   * Inscribe a un estudiante en un NRC en un periodo determinado.
   * POST /api/cursos/inscribir-estudiante
   */
  async inscribirEstudiante(data: InscribirEstudiantePayload): Promise<{ mensaje: string }> {
    const response = await apiClient.post<{ mensaje: string }>(
      '/cursos/inscribir-estudiante',
      data
    );
    return response.data;
  },

  /**
   * Permite inscribir múltiples estudiantes simultáneamente a un NRC.
   * POST /api/cursos/inscribir-lote
   */
  async inscribirLote(data: InscribirLotePayload): Promise<{ mensaje: string; inscritos?: number }> {
    const response = await apiClient.post<{ mensaje: string; inscritos?: number }>(
      '/cursos/inscribir-lote',
      data
    );
    return response.data;
  },

  /**
   * Obtiene la lista de estudiantes inscritos en un curso/periodo.
   * GET /api/cursos/:id/estudiantes
   */
  async getEstudiantesCurso(idCurso: number, idPeriodo?: number): Promise<EstudianteCurso[]> {
    const params: Record<string, any> = {};
    if (idPeriodo) params.Id_Periodo = idPeriodo;
    const response = await apiClient.get<EstudianteCurso[]>(`/cursos/${idCurso}/estudiantes`, {
      params,
    });
    return response.data || [];
  },
};
