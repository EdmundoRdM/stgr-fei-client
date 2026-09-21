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
