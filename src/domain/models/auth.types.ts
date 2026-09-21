export type UserRole =
  | 'Administrador'
  | 'Profesor'
  | 'Secretaria de grupo'
  | 'Secretaria de facultad'
  | 'Directivo'
  | 'Usuario de consulta'
  | string;

export interface User {
  numeroPersonal: number | string;
  nombre: string;
  correo: string;
  rol: UserRole;
  Id_Rol?: number | null;
  idRol?: number | null;
  Id_rol?: number | null;
  Rol?: {
    Id_Rol?: number;
    NombreRol?: string;
  };
}

export interface LoginCredentials {
  correo: string;
  contrasenia: string;
}

export interface AuthResponse {
  mensaje: string;
  usuario: User;
}

export interface ApiErrorResponse {
  error: string;
  detalle?: string;
}
