import type { User } from '@/domain/models/auth.types';

/**
 * Mapeo de roles de usuario según las directrices del sistema:
 * - Rol 1: Director de la facultad
 * - Rol 2: Secretaria académica (Secretaria de la facultad)
 * - Rol 3: Jefe de carrera
 * - Sin rol o cualquier otro: Profesor
 */
export const resolveRoleName = (user?: User | null): string => {
  if (!user) return 'Profesor';

  const rawRolId =
    user.Id_Rol ??
    user.idRol ??
    user.Id_rol ??
    user.Rol?.Id_Rol ??
    (typeof user.rol === 'number' ? user.rol : null);

  const numRol = rawRolId !== null && rawRolId !== undefined ? Number(rawRolId) : null;

  if (numRol === 1) return 'Director de la Facultad';
  if (numRol === 2) return 'Secretaria Académica';
  if (numRol === 3) return 'Jefe de Carrera';

  if (user.rol && typeof user.rol === 'string') {
    const r = user.rol.toLowerCase().trim();
    if (r.includes('grupo')) return 'Secretaria de Grupo';
    if (r === '1' || r.includes('director')) return 'Director de la Facultad';
    if (r === '2' || r.includes('secretaria') || r.includes('secretario')) return 'Secretaria Académica';
    if (r === '3' || r.includes('jefe')) return 'Jefe de Carrera';
  }

  return 'Profesor';
};

export const isDirector = (user?: User | null): boolean => resolveRoleName(user) === 'Director de la Facultad';
export const isSecretaria = (user?: User | null): boolean => resolveRoleName(user) === 'Secretaria Académica';
export const isJefeCarrera = (user?: User | null): boolean => resolveRoleName(user) === 'Jefe de Carrera';
export const isSecretariaGrupo = (user?: User | null): boolean => resolveRoleName(user) === 'Secretaria de Grupo';
export const isSoloProfesor = (user?: User | null): boolean => resolveRoleName(user) === 'Profesor';

/**
 * Determina si el usuario actual cuenta con facultades directivas
 * (Director de la Facultad, Secretaria Académica o Jefe de Carrera).
 */
export const isDirectivo = (user?: User | null): boolean => {
  const role = resolveRoleName(user);
  return role === 'Director de la Facultad' || role === 'Secretaria Académica' || role === 'Jefe de Carrera';
};

/**
 * Determina si el usuario es personal administrativo o directivo
 * (no debe ver borradores de docentes).
 */
export const isPersonalAdministrativo = (user?: User | null): boolean => {
  return isDirectivo(user) || isSecretariaGrupo(user);
};

/**
 * Determina si el usuario tiene permiso para finalizar un trabajo recepcional
 * (Secretaria de la Facultad / Académica y Secretaria de Grupo).
 */
export const canFinalizarTrabajo = (user?: User | null): boolean => {
  return isDirectivo(user) || isSecretariaGrupo(user);
};
