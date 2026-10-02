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
 * Determina si el usuario tiene permiso para recibir y cotejar documentos
 * (Secretaria de la Facultad / Académica y Secretaria de Grupo).
 * El Jefe de Carrera y el Director de la Facultad NO pueden recibir documentos.
 */
export const canRecibirDocumentos = (user?: User | null): boolean => {
  return isSecretaria(user) || isSecretariaGrupo(user);
};

/**
 * Determina si el usuario tiene permiso para generar el acta oficial
 * (Secretaria de la Facultad / Académica y Secretaria de Grupo).
 * El Jefe de Carrera y el Director de la Facultad NO pueden generar actas.
 */
export const canGenerarActa = (user?: User | null): boolean => {
  return isSecretaria(user) || isSecretariaGrupo(user);
};

/**
 * Determina si el usuario tiene permiso para finalizar un trabajo recepcional
 * asignando tomo, folio oficial y resultado (Secretaria de la Facultad y Secretaria de Grupo).
 * El Jefe de Carrera y el Director de la Facultad NO pueden finalizar trabajos.
 */
export const canFinalizarTrabajo = (user?: User | null): boolean => {
  return isSecretaria(user) || isSecretariaGrupo(user);
};

/**
 * Determina si el usuario tiene permiso para validar (aceptar/rechazar) trabajos en estado 'Registrado'
 * - Únicamente Secretaría de la Facultad / Académica y Secretaría de Grupo.
 * - El Jefe de Carrera y el Director de la Facultad NO pueden validar ni rechazar (solo supervisión/lectura).
 */
export const canValidarTrabajo = (user?: User | null): boolean => {
  return isSecretaria(user) || isSecretariaGrupo(user);
};

/**
 * Determina si el usuario puede editar un trabajo recepcional según su estado y rol.
 * - Jefe de Carrera y Director de la Facultad: NO pueden editar ningún trabajo (solo pueden ver),
 *   a menos que sea su propio borrador si tienen grupo de ER asignado como profesor a cargo.
 * - Profesor: únicamente su propio borrador dentro de sus grupos de ER.
 * - Registrado, Aprobado, Generado: Secretaria de Facultad o Secretaria de Grupo.
 * - Finalizado: Secretaria de la Facultad (para corrección de tomo/folio).
 */
export const canEditarTrabajo = (
  user?: User | null,
  estadoNombre?: string,
  esPropioBorrador = false
): boolean => {
  if (!user) return false;
  const estado = estadoNombre?.trim() || '';

  // Director y Jefe de Carrera no pueden editar ningún trabajo, solo su propio borrador
  if (isDirector(user) || isJefeCarrera(user)) {
    return estado === 'Borrador' && esPropioBorrador;
  }

  if (estado === 'Borrador') {
    return !isPersonalAdministrativo(user) || esPropioBorrador;
  }
  if (estado === 'Finalizado') {
    return isSecretaria(user);
  }
  if (estado === 'Registrado' || estado === 'Aprobado' || estado === 'Generado') {
    return isSecretaria(user) || isSecretariaGrupo(user);
  }
  return false;
};

/**
 * Determina si el usuario puede eliminar un trabajo recepcional.
 * - Jefe de Carrera y Director: NO pueden eliminar ningún trabajo, salvo su propio borrador si tienen grupo de ER.
 * - Borrador: el profesor autor/participante de su propio borrador.
 * - Otros estados: Secretaria de la Facultad.
 */
export const canEliminarTrabajo = (
  user?: User | null,
  estadoNombre?: string,
  esPropioBorrador = false
): boolean => {
  if (!user) return false;
  const estado = estadoNombre?.trim() || '';

  // Director y Jefe de Carrera no pueden eliminar ningún trabajo, solo su propio borrador
  if (isDirector(user) || isJefeCarrera(user)) {
    return estado === 'Borrador' && esPropioBorrador;
  }

  if (estado === 'Borrador') {
    return !isPersonalAdministrativo(user) || esPropioBorrador;
  }
  return isSecretaria(user);
};

/**
 * Determina si el usuario tiene permitido registrar un nuevo trabajo recepcional:
 * - Profesor, Director de la Facultad y Jefe de Carrera: SÍ, pero únicamente si están
 *   asignados como profesor a cargo de al menos un grupo de Experiencia Recepcional activo.
 * - Secretarias: NO (funciones de gestión y recepción documental).
 */
export const canRegistrarTrabajo = (user?: User | null, tieneGrupoERActivo = false): boolean => {
  if (!user) return false;
  if (isSoloProfesor(user) || isDirector(user) || isJefeCarrera(user)) {
    return Boolean(tieneGrupoERActivo);
  }
  return false;
};

/**
 * Obtiene el identificador numérico de la carrera vinculada al usuario (p. ej. Jefe de Carrera)
 */
export const getUserCarreraId = (user?: User | null): number | undefined => {
  if (!user) return undefined;
  const rawId =
    user.Id_Carrera ??
    user.idCarrera ??
    (user as any).id_carrera ??
    user.Carrera?.Id_Carrera ??
    (user as any).carrera?.Id_Carrera;

  if (rawId !== undefined && rawId !== null && rawId !== '') {
    const num = Number(rawId);
    if (!isNaN(num) && num > 0) return num;
  }

  // Detección por nombre si el backend serializó la carrera en texto
  const text = `${user.Carrera?.NombreCarrera || ''} ${(user as any).carrera || ''} ${user.rol || ''}`.toLowerCase();
  if (text.includes('software')) return 1;
  if (text.includes('datos')) return 2;
  if (text.includes('redes')) return 3;
  if (text.includes('tecnolog') || text.includes('informacion')) return 4;
  if (text.includes('estadist')) return 5;

  // Fallback seguro por número de personal para Jefes de Carrera en plantilla docente
  const numPersonal = String(user.numeroPersonal ?? (user as any).Numero_Personal ?? '').trim();
  if (numPersonal === '0004' || numPersonal === '0003' || numPersonal === '0007') return 1; // Ingeniería de Software
  if (numPersonal === '0008') return 2; // Ciencia de Datos
  if (numPersonal === '0009' || numPersonal === '0010') return 3; // Redes y Servicios de Cómputo
  if (numPersonal === '0005') return 4; // Tecnologías de la Información
  if (numPersonal === '0006') return 5; // Estadística

  return undefined;
};
