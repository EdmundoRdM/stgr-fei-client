import type { Carrera } from './trabajo.types';

export interface EstudianteCurso {
  Matricula: string;
  NombreCompleto: string;
  CorreoInstitucional?: string;
  Carrera?: Carrera;
}

export interface CursoER {
  Id_Curso: number;
  NRC: string;
  Nombre: string;
}

export interface PeriodoEscolar {
  Id_Periodo: number;
  Nomenclatura: string;
  Fecha_inicio: string;
  Fecha_fin: string;
}

export interface GrupoProfesor {
  idAsignacion: number;
  curso: CursoER;
  periodo: PeriodoEscolar;
  estudiantes: EstudianteCurso[];
}

export interface DetalleCursoER extends CursoER {
  profesores?: any[];
  estudiantes?: EstudianteCurso[];
}

export interface AsignarProfesorPayload {
  Id_Curso: number;
  Numero_Personal: string | number;
  Id_Periodo: number;
}

export interface InscribirEstudiantePayload {
  Id_Curso: number;
  Matricula: string;
  Id_Periodo: number;
}

export interface InscribirLotePayload {
  Id_Curso: number;
  Id_Periodo: number;
  matriculas: string[];
}
