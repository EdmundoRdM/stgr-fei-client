export interface Carrera {
  Id_Carrera: number;
  NombreCarrera: string;
}

export interface Lugar {
  Id_Lugar: number;
  Nombre: string;
  Edificio?: string | null;
}

export interface EstadoTrabajo {
  Id_Estado: number;
  EstadoNombre: 'Borrador' | 'Registrado' | 'Aprobado' | 'Generado' | 'Finalizado' | string;
}

export interface AcademicoData {
  Numero_Personal?: string | number;
  Nombre: string;
  ApellidoP: string;
  ApellidoM?: string;
  CorreoInstitucional?: string;
  Id_Carrera?: number;
  Id_Rol?: number;
  Carrera?: Carrera;
}

export interface RolParticipacionData {
  Id_rol?: number;
  NombreRol: string;
}

export interface Participante {
  Id_Participacion?: number;
  Id_TrabajoR?: number;
  Numero_Personal?: string | number;
  Id_rol?: number;
  Academico?: AcademicoData;
  RolDeParticipacion?: RolParticipacionData;
  Rol_de_participacion?: RolParticipacionData;
}

export interface EstudianteData {
  Matricula: string;
  NombreCompleto: string;
  CorreoInstitucional?: string;
  CorreoAlterno?: string;
}

export interface EstudianteAsignado {
  Id_EstudianteTrabajo?: number;
  Id_TrabajoR?: number;
  Matricula?: string;
  Estudiante?: EstudianteData;
}

export interface ParticipantesTrabajoResponse {
  Id_TrabajoR: string | number;
  academicos: Participante[];
  estudiantes: EstudianteAsignado[];
}

export interface TrabajoRecepcional {
  Id_TrabajoR: number;
  Titulo: string;
  Folio: string;
  Tomo?: number | null;
  Numero_Folio?: number | null;
  Modalidad: string;
  Fecha_defensa: string;
  Resultado: string;
  Id_Carrera?: number;
  Id_Lugar?: number;
  Id_Estado?: number;
  Carrera?: Carrera;
  Lugar?: Lugar;
  EstadoListum?: EstadoTrabajo;
  academicos?: Participante[];
  estudiantes?: EstudianteAsignado[];
  ParticipantesTrabajos?: Participante[];
  EstudianteTrabajos?: EstudianteAsignado[];
  checklistCompleto?: boolean;
}

export interface SugerenciaFolioResponse {
  Id_Carrera: number;
  Tomo: number;
  Numero_Folio: number;
  FolioSugerido: string;
  foliosOcupadosEnTomo: number;
  foliosDisponiblesEnTomo: number;
  esNuevoTomo: boolean;
  estaLleno: boolean;
  mensaje?: string;
}

export interface EstadoTomoResponse {
  Id_Carrera?: number;
  Tomo: number;
  foliosOcupados: number;
  foliosDisponibles: number;
  foliosTomados?: number[];
  estaLleno: boolean;
}

export interface ResumenTomo {
  Tomo: number;
  foliosOcupados: number;
  foliosDisponibles: number;
  estaLleno: boolean;
  [key: string]: any;
}

export interface FinalizarTrabajoPayload {
  Tomo?: number | null;
  Numero_Folio?: number | null;
  Folio?: string;
  Resultado: string;
  Numero_Personal?: string | number | null;
}
