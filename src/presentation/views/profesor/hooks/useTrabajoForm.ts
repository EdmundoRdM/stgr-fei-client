import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { academicoService } from '@/services/academicos/academicoService';
import { estudianteService } from '@/services/estudiantes/estudianteService';
import { trabajoService, type GuardarTrabajoPayload } from '@/services/trabajos/trabajoService';
import { cursoService } from '@/services/cursos/cursoService';
import { useAuth } from '@/context/AuthContext';
import { isDirector, isSoloProfesor, isJefeCarrera, getUserCarreraId } from '@/utils/roleUtils';
import type { SelectOption } from '@/presentation/components/SearchableSelect';
import type { TrabajoRecepcional } from '@/domain/models/trabajo.types';


// Helper para formatear cualquier fecha proveniente de la API al formato estricto de datetime-local (YYYY-MM-DDTHH:mm)
export const formatToDateTimeLocal = (fechaRaw?: string | null): string => {
  if (!fechaRaw) return '';
  const str = fechaRaw.trim();
  if (!str) return '';

  if (str.includes('T') || str.includes(' ')) {
    const parts = str.replace(' ', 'T').split('T');
    const datePart = parts[0];
    let timePart = parts[1] || '09:00';
    timePart = timePart.substring(0, 5);
    if (!timePart || timePart === '00:00') {
      timePart = '09:00';
    }
    return `${datePart}T${timePart}`;
  }

  return `${str}T09:00`;
};

// Helper para extraer fecha (YYYY-MM-DD), hora de inicio (HH:mm) y hora de fin (HH:mm)
export const extraerFechaYHoras = (
  fechaInicioRaw?: string | null,
  fechaFinRaw?: string | null
): { fecha: string; horaInicio: string; horaFin: string } => {
  if (!fechaInicioRaw) {
    return { fecha: '', horaInicio: '10:00', horaFin: '12:00' };
  }

  const strIni = fechaInicioRaw.trim();
  let fecha = '';
  let horaInicio = '10:00';
  let horaFin = '12:00';

  if (strIni.includes('T') || strIni.includes(' ')) {
    const parts = strIni.replace(' ', 'T').split('T');
    fecha = parts[0] || '';
    const rawTime = (parts[1] || '').substring(0, 5);
    if (rawTime && rawTime !== '00:00') {
      horaInicio = rawTime;
    }
  } else {
    fecha = strIni;
  }

  if (fechaFinRaw) {
    const strFin = fechaFinRaw.trim();
    if (strFin.includes('T') || strFin.includes(' ')) {
      const partsFin = strFin.replace(' ', 'T').split('T');
      const rawTimeFin = (partsFin[1] || '').substring(0, 5);
      if (rawTimeFin && rawTimeFin !== '00:00') {
        horaFin = rawTimeFin;
      }
    }
  } else if (horaInicio) {
    // Si no hay hora fin explícita, sugerir 2 horas después de la hora de inicio
    const [hStr, mStr] = horaInicio.split(':');
    const hNum = parseInt(hStr, 10);
    if (!isNaN(hNum)) {
      const finH = Math.min(hNum + 2, 23);
      horaFin = `${String(finH).padStart(2, '0')}:${mStr || '00'}`;
    }
  }

  return { fecha, horaInicio, horaFin };
};


// Helper para detectar contenido malicioso, inyecciones XSS o SQL
export const detectarContenidoMalicioso = (texto: string): string | null => {
  if (!texto) return null;

  // 1. Detección de etiquetas HTML o scripts (XSS)
  const xssTagPattern = /<[a-z\s\S]*?>/i;
  if (xssTagPattern.test(texto)) {
    return 'No se permiten etiquetas HTML ni código de scripts.';
  }

  // 2. Detección de URLs con esquema ejecutable (javascript:, data:text/html)
  const dangerousSchemePattern = /(javascript:|data:text\/html|vbscript:)/i;
  if (dangerousSchemePattern.test(texto)) {
    return 'No se permiten enlaces o esquemas ejecutables.';
  }

  // 3. Detección de controladores de eventos HTML
  const eventHandlerPattern = /\bon\w+\s*=/i;
  if (eventHandlerPattern.test(texto)) {
    return 'No se permiten controladores de eventos en las entradas.';
  }

  // 4. Detección de inyecciones SQL comunes
  const sqlInjectionPattern =
    /\b(union\s+select|select\s+[\s\S]+?\s+from|insert\s+into|delete\s+from|drop\s+table|drop\s+database|alter\s+table|exec\s*\(|xp_cmdshell)\b/i;
  if (sqlInjectionPattern.test(texto)) {
    return 'No se permiten sentencias o palabras reservadas de bases de datos.';
  }

  // 5. Detección de patrones de ataque de comentarios SQL o inyecciones booleanas
  const sqlAttackPattern = /('--|;\s*--|\/\*|\*\/|'\s*or\s*'1'\s*=\s*'1|"\s*or\s*"1"\s*=\s*"1)/i;
  if (sqlAttackPattern.test(texto)) {
    return 'Se detectaron patrones de inyección o caracteres no permitidos.';
  }

  return null;
};

// Normalizador de texto para comparaciones insensibles a mayúsculas y acentos
const normalizeText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

// Helper robusto para encontrar el Número de Personal de un participante según su rol
const findNumeroPersonalByRol = (
  participantes: any[],
  rolId: number,
  nombreRol: string
): string | undefined => {
  const targetNorm = normalizeText(nombreRol);
  const part = participantes.find((p: any) => {
    // 1. Coincidencia por ID numérico en múltiples variantes de nomenclatura
    const pRolId = Number(
      p.Id_rol ??
        p.Id_Rol ??
        p.id_rol ??
        p.idRol ??
        p.RolDeParticipacion?.Id_rol ??
        p.RolDeParticipacion?.Id_Rol ??
        p.Rol_de_participacion?.Id_rol ??
        p.Rol_de_participacion?.Id_Rol ??
        p.Rol?.Id_Rol ??
        p.Rol?.Id_rol
    );
    if (!isNaN(pRolId) && pRolId === rolId) {
      return true;
    }

    // 2. Coincidencia por nombre de rol
    const pNombre = normalizeText(
      p.RolDeParticipacion?.NombreRol ??
        p.Rol_de_participacion?.NombreRol ??
        p.Rol?.NombreRol ??
        p.NombreRol ??
        p.nombreRol ??
        ''
    );

    if (!pNombre) return false;

    // Distinción clara entre Director y Codirector
    if (targetNorm === 'director') {
      return pNombre === 'director' || (pNombre.includes('director') && !pNombre.includes('co'));
    }
    if (targetNorm === 'codirector') {
      return (
        pNombre.includes('codirector') ||
        pNombre.includes('co-director') ||
        pNombre.includes('co director')
      );
    }

    return pNombre.includes(targetNorm);
  });

  if (!part) return undefined;

  const numPersonal =
    part.Numero_Personal ??
    part.numeroPersonal ??
    part.NumeroPersonal ??
    part.Academico?.Numero_Personal ??
    part.Academico?.numeroPersonal ??
    part.academico?.Numero_Personal ??
    part.academico?.numeroPersonal;

  return numPersonal !== undefined && numPersonal !== null ? String(numPersonal) : undefined;
};

interface UseTrabajoFormParams {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: GuardarTrabajoPayload) => Promise<void>;
  trabajoToEdit?: TrabajoRecepcional | null;
  existingTrabajos?: TrabajoRecepcional[];
}

export const useTrabajoForm = ({
  isOpen,
  onClose,
  onSave,
  trabajoToEdit,
  existingTrabajos = [],
}: UseTrabajoFormParams) => {
  const { user } = useAuth();
  const esDirectorUser = isDirector(user);

  const esDocenteUser = isSoloProfesor(user);
  const esJefeCarrera = isJefeCarrera(user);
  const userCarreraId = getUserCarreraId(user);
  // Un docente titular, el Director de la Facultad o el Jefe de Carrera (con grupo de ER) registran con base en su grupo de ER
  const esProfesorRegistrando = (esDocenteUser || esDirectorUser || esJefeCarrera) && !trabajoToEdit;

  // Estado del formulario
  const [carreraId, setCarreraId] = useState<number>(userCarreraId || 1);
  const [modalidad, setModalidad] = useState<string>('Monografía');
  const [titulo, setTitulo] = useState<string>('');
  const [fecha, setFecha] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState<string>('10:00');
  const [horaFin, setHoraFin] = useState<string>('12:00');
  const [fechaHora, setFechaHora] = useState<string>('');
  const [lugarId, setLugarId] = useState<number>(1);
  const [folio, setFolio] = useState<string>('Pendiente');
  const [tomo, setTomo] = useState<number | undefined>(undefined);
  const [numeroFolio, setNumeroFolio] = useState<number | undefined>(undefined);
  const [resultado, setResultado] = useState<string>('Pendiente');


  // Lista de estudiantes seleccionados (soporte para múltiples estudiantes)
  const [matriculasEstudiantes, setMatriculasEstudiantes] = useState<string[]>(['']);

  // Participantes seleccionados (Numero_Personal para cada rol)
  const [directorId, setDirectorId] = useState<string | number | undefined>(undefined);
  const [codirectorId, setCodirectorId] = useState<string | number | undefined>(undefined);
  const [presidenteId, setPresidenteId] = useState<string | number | undefined>(undefined);
  const [secretarioId, setSecretarioId] = useState<string | number | undefined>(undefined);
  const [vocalId, setVocalId] = useState<string | number | undefined>(undefined);
  const [sinodalId, setSinodalId] = useState<string | number | undefined>(undefined);

  // Errores de validación
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Cargar lista de académicos registrados para búsqueda activa
  const { data: academicos = [] } = useQuery({
    queryKey: ['academicos'],
    queryFn: () => academicoService.getAcademicos(),
    enabled: isOpen,
  });

  // Cargar lista de estudiantes generales registrados
  const { data: estudiantes = [] } = useQuery({
    queryKey: ['estudiantes'],
    queryFn: () => estudianteService.getEstudiantes(),
    enabled: isOpen && (!esProfesorRegistrando || !!trabajoToEdit),
  });

  // Consultar grupos de Experiencia Recepcional del profesor en el periodo escolar activo
  const {
    data: misGrupos = [],
    isLoading: isLoadingGrupos,
  } = useQuery({
    queryKey: ['mis-grupos-actual', user?.numeroPersonal],
    queryFn: () => cursoService.getMisGrupos({ soloActual: true }),
    enabled: isOpen && esProfesorRegistrando,
  });

  // Consultar el periodo escolar vigente
  const { data: periodoActual } = useQuery({
    queryKey: ['periodo-actual'],
    queryFn: () => cursoService.getPeriodoActual(),
    enabled: isOpen,
  });

  // Consultar directamente a la API los participantes del trabajo al editar para garantizar datos actualizados
  const { data: participantesDetalle } = useQuery({
    queryKey: ['participantes-detalle', trabajoToEdit?.Id_TrabajoR],
    queryFn: () => trabajoService.getParticipantesByTrabajo(trabajoToEdit!.Id_TrabajoR),
    enabled: isOpen && !!trabajoToEdit?.Id_TrabajoR,
  });

  // Precondición: el profesor registrando no tiene grupos de ER asignados en el periodo actual
  const sinGruposPeriodoActual = Boolean(
    esProfesorRegistrando && !isLoadingGrupos && misGrupos.length === 0
  );

  // Extraer estudiantes de los grupos de ER del periodo actual asignados al profesor
  const estudiantesGrupoActual = useMemo(() => {
    const lista: Array<{
      matricula: string;
      nombreCompleto: string;
      correo?: string;
      nrc?: string;
      nombreCurso?: string;
    }> = [];

    misGrupos.forEach((g) => {
      const nrc = g.curso?.NRC || '';
      const nombreCurso = g.curso?.Nombre || 'Experiencia Recepcional';
      (g.estudiantes || []).forEach((est) => {
        if (!lista.some((e) => e.matricula === est.Matricula)) {
          lista.push({
            matricula: est.Matricula,
            nombreCompleto: est.NombreCompleto,
            correo: est.CorreoInstitucional,
            nrc,
            nombreCurso,
          });
        }
      });
    });

    return lista;
  }, [misGrupos]);

  // Información contextual del grupo y periodo para mostrar al profesor
  const infoGrupos = useMemo(() => {
    if (!esProfesorRegistrando) return undefined;
    if (sinGruposPeriodoActual) return undefined;
    const nrcs = misGrupos.map((g) => g.curso?.NRC).filter(Boolean).join(', ');
    const periodoNom = periodoActual?.Nomenclatura ? ` (${periodoActual.Nomenclatura})` : '';
    return `Mostrando alumnos de tu(s) grupo(s) de ER${periodoNom}: NRC ${nrcs || 'asignado'}.`;
  }, [esProfesorRegistrando, sinGruposPeriodoActual, misGrupos, periodoActual]);

  // Lista unificada de participantes académicos
  const participantesLista: any[] = useMemo(() => {
    if (participantesDetalle?.academicos && participantesDetalle.academicos.length > 0) {
      return participantesDetalle.academicos;
    }
    return (
      (trabajoToEdit as any)?.academicos ||
      (trabajoToEdit as any)?.participantes ||
      trabajoToEdit?.ParticipantesTrabajos ||
      (trabajoToEdit as any)?.Participantes ||
      []
    );
  }, [participantesDetalle, trabajoToEdit]);

  // Lista unificada de estudiantes asignados
  const estudiantesLista: any[] = useMemo(() => {
    if (participantesDetalle?.estudiantes && participantesDetalle.estudiantes.length > 0) {
      return participantesDetalle.estudiantes;
    }
    return (
      (trabajoToEdit as any)?.estudiantes ||
      trabajoToEdit?.EstudianteTrabajos ||
      (trabajoToEdit as any)?.Estudiantes ||
      []
    );
  }, [participantesDetalle, trabajoToEdit]);

  // Convertir académicos a opciones de Select
  const academicosOptions: SelectOption[] = useMemo(() => {
    return academicos.map((ac) => ({
      value: ac.Numero_Personal !== undefined && ac.Numero_Personal !== null ? String(ac.Numero_Personal) : '',
      label: `${ac.Nombre} ${ac.ApellidoP} ${ac.ApellidoM || ''}`.trim(),
      sublabel: ac.CorreoInstitucional,
    }));
  }, [academicos]);

  // Opciones de estudiantes:
  // - Si es profesor registrando: únicamente alumnos inscritos en su grupo de ER del periodo escolar actual
  // - Si es directivo o en modo edición: estudiantes del catálogo general o asignados
  const estudiantesOptions: SelectOption[] = useMemo(() => {
    if (esProfesorRegistrando) {
      return estudiantesGrupoActual.map((est) => ({
        value: est.matricula,
        label: `${est.nombreCompleto} (${est.matricula})`,
        sublabel: `NRC ${est.nrc} - ${est.nombreCurso}${est.correo ? ` • ${est.correo}` : ''}`,
      }));
    }

    return estudiantes.map((est) => ({
      value: est.Matricula,
      label: `${est.NombreCompleto} (${est.Matricula})`,
      sublabel: est.CorreoInstitucional,
    }));
  }, [esProfesorRegistrando, estudiantesGrupoActual, estudiantes]);

  // Rellenar formulario cuando se abre en modo edición
  useEffect(() => {
    if (isOpen) {
      if (trabajoToEdit) {
        setTitulo(trabajoToEdit.Titulo || '');
        setModalidad(trabajoToEdit.Modalidad || 'Monografía');
        setCarreraId(trabajoToEdit.Id_Carrera || trabajoToEdit.Carrera?.Id_Carrera || 1);
        setLugarId(trabajoToEdit.Id_Lugar || trabajoToEdit.Lugar?.Id_Lugar || 1);
        setTomo(trabajoToEdit.Tomo ?? undefined);
        setNumeroFolio(trabajoToEdit.Numero_Folio ?? undefined);
        setFolio(trabajoToEdit.Folio || 'Pendiente');
        setResultado(trabajoToEdit.Resultado || 'Pendiente');

        // Formatear fecha y hora
        if (trabajoToEdit.Fecha_defensa) {
          const { fecha: pFecha, horaInicio: pHoraInicio, horaFin: pHoraFin } = extraerFechaYHoras(
            trabajoToEdit.Fecha_defensa,
            trabajoToEdit.Fecha_fin_defensa
          );
          setFecha(pFecha);
          setHoraInicio(pHoraInicio);
          setHoraFin(pHoraFin);
          setFechaHora(pFecha && pHoraInicio ? `${pFecha}T${pHoraInicio}` : '');
        } else {
          setFecha('');
          setHoraInicio('10:00');
          setHoraFin('12:00');
          setFechaHora('');
        }

        // Cargar lista de estudiantes asignados inicialmente
        const mats = estudiantesLista
          .map((e: any) => e.Matricula || e.matricula || e.Estudiante?.Matricula || e.estudiante?.Matricula)
          .filter(Boolean) as string[];

        setMatriculasEstudiantes(mats.length > 0 ? mats : ['']);

        // Cargar participantes disponibles inicialmente
        setDirectorId(findNumeroPersonalByRol(participantesLista, 1, 'director'));
        setCodirectorId(findNumeroPersonalByRol(participantesLista, 2, 'codirector'));
        setPresidenteId(findNumeroPersonalByRol(participantesLista, 3, 'presidente'));
        setSecretarioId(findNumeroPersonalByRol(participantesLista, 4, 'secretario'));
        setVocalId(findNumeroPersonalByRol(participantesLista, 5, 'vocal'));
        setSinodalId(findNumeroPersonalByRol(participantesLista, 6, 'sinodal'));
      } else {
        // Reset a valores por defecto para nuevo registro
        setTitulo('');
        setModalidad('Monografía');
        setCarreraId(userCarreraId || 1);
        setLugarId(1);
        setFecha('');
        setHoraInicio('10:00');
        setHoraFin('12:00');
        setFechaHora('');
        setTomo(undefined);
        setNumeroFolio(undefined);
        setFolio('Pendiente');
        setResultado('Pendiente');
        setMatriculasEstudiantes(['']);
        // Si el usuario es docente o director registrando para su grupo, preasignarlo como Director del trabajo
        const titularDirector = (esDocenteUser || esDirectorUser) && user?.numeroPersonal ? String(user.numeroPersonal) : undefined;
        setDirectorId(titularDirector);
        setCodirectorId(undefined);
        setPresidenteId(undefined);
        setSecretarioId(undefined);
        setVocalId(undefined);
        setSinodalId(undefined);
      }
      setErrors({});
    }
  }, [isOpen, trabajoToEdit]);


  // Sincronizar participantes cuando lleguen datos de la API o cambie la lista de participantes
  useEffect(() => {
    if (isOpen && trabajoToEdit && participantesLista.length > 0) {
      const d = findNumeroPersonalByRol(participantesLista, 1, 'director');
      const cd = findNumeroPersonalByRol(participantesLista, 2, 'codirector');
      const pres = findNumeroPersonalByRol(participantesLista, 3, 'presidente');
      const sec = findNumeroPersonalByRol(participantesLista, 4, 'secretario');
      const voc = findNumeroPersonalByRol(participantesLista, 5, 'vocal');
      const sin = findNumeroPersonalByRol(participantesLista, 6, 'sinodal');

      if (d !== undefined) setDirectorId(d);
      if (cd !== undefined) setCodirectorId(cd);
      if (pres !== undefined) setPresidenteId(pres);
      if (sec !== undefined) setSecretarioId(sec);
      if (voc !== undefined) setVocalId(voc);
      if (sin !== undefined) setSinodalId(sin);
    }
  }, [isOpen, trabajoToEdit, participantesLista]);

  // Sincronizar estudiantes cuando lleguen datos de la API
  useEffect(() => {
    if (isOpen && trabajoToEdit && estudiantesLista.length > 0) {
      const mats = estudiantesLista
        .map((e: any) => e.Matricula || e.matricula || e.Estudiante?.Matricula || e.estudiante?.Matricula)
        .filter(Boolean) as string[];
      if (mats.length > 0) {
        setMatriculasEstudiantes(mats);
      }
    }
  }, [isOpen, trabajoToEdit, estudiantesLista]);

  // Reglas de negocio CU-05:
  const estadoNombreActual = trabajoToEdit?.EstadoListum?.EstadoNombre || 'Borrador';
  const isFinalizado = estadoNombreActual === 'Finalizado';
  const isAprobadoOGenerado = estadoNombreActual === 'Aprobado' || estadoNombreActual === 'Generado';
  const isFolioResultadoLocked = isAprobadoOGenerado || !isFinalizado;

  const handleTomoChange = (val: number | undefined) => {
    setTomo(val);
    if (val !== undefined && val !== null && numeroFolio !== undefined && numeroFolio !== null) {
      setFolio(`Tomo ${val} - Folio ${numeroFolio}`);
    } else if (val !== undefined && val !== null) {
      setFolio(`Tomo ${val}`);
    }
  };

  const handleNumeroFolioChange = (val: number | undefined) => {
    setNumeroFolio(val);
    if (tomo !== undefined && tomo !== null && val !== undefined && val !== null) {
      setFolio(`Tomo ${tomo} - Folio ${val}`);
    } else if (val !== undefined && val !== null) {
      setFolio(`Folio ${val}`);
    }
  };

  // Manejo dinámico de estudiantes
  const handleAddEstudiante = () => {
    setMatriculasEstudiantes((prev) => [...prev, '']);
  };

  const handleRemoveEstudiante = (indexToRemove: number) => {
    setMatriculasEstudiantes((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      return updated.length === 0 ? [''] : updated;
    });
  };

  const handleEstudianteChange = (index: number, val: string | number | undefined) => {
    const matriculaStr = val ? String(val) : '';
    setMatriculasEstudiantes((prev) =>
      prev.map((m, idx) => (idx === index ? matriculaStr : m))
    );
  };

  // Validación de conflicto de horario y lugar / carrera (Regla 1 y Regla 2 del backend)
  const { conflictoLugar, conflictoCarrera } = useMemo(() => {
    if (!fecha || !horaInicio) {
      return { conflictoLugar: null, conflictoCarrera: null };
    }

    const inicioPropuesto = new Date(`${fecha}T${horaInicio}:00`);
    if (isNaN(inicioPropuesto.getTime())) {
      return { conflictoLugar: null, conflictoCarrera: null };
    }

    let finPropuesto: Date;
    if (horaFin) {
      finPropuesto = new Date(`${fecha}T${horaFin}:00`);
    } else {
      finPropuesto = new Date(inicioPropuesto.getTime() + 2 * 60 * 60 * 1000);
    }
    if (isNaN(finPropuesto.getTime())) {
      return { conflictoLugar: null, conflictoCarrera: null };
    }

    const editId = trabajoToEdit
      ? String(trabajoToEdit.Id_TrabajoR || (trabajoToEdit as any).id || '')
      : null;

    let cLugar: any = null;
    let cCarrera: any = null;

    for (const t of existingTrabajos) {
      const otherId = String(t.Id_TrabajoR || (t as any).id || '');
      if (editId && otherId && editId === otherId) continue;
      if (!t.Fecha_defensa) continue;

      const tInicio = new Date(t.Fecha_defensa);
      if (isNaN(tInicio.getTime())) continue;

      let tFin: Date;
      if (t.Fecha_fin_defensa) {
        tFin = new Date(t.Fecha_fin_defensa);
      } else {
        tFin = new Date(tInicio.getTime() + 2 * 60 * 60 * 1000);
      }
      if (isNaN(tFin.getTime())) continue;

      // Condición de solapamiento de intervalos: inicioA < finB && finA > inicioB
      const seSolapa = inicioPropuesto < tFin && finPropuesto > tInicio;
      if (!seSolapa) continue;

      const hIniStr = tInicio.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
      const hFinStr = tFin.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });

      // 1. Conflicto de espacio físico (mismo lugar)
      const tLugarId = Number(t.Id_Lugar || t.Lugar?.Id_Lugar);
      if (!cLugar && lugarId && tLugarId === Number(lugarId)) {
        cLugar = {
          trabajo: t,
          Titulo: t.Titulo,
          lugarNombre: t.Lugar?.Nombre || 'Recinto seleccionado',
          horaInicio: hIniStr,
          horaFin: hFinStr,
        };
      }

      // 2. Conflicto de carrera simultánea (misma licenciatura independientemente del salón)
      const tCarreraId = Number(t.Id_Carrera || t.Carrera?.Id_Carrera);
      if (!cCarrera && carreraId && tCarreraId === Number(carreraId)) {
        cCarrera = {
          trabajo: t,
          Titulo: t.Titulo,
          carreraNombre: t.Carrera?.NombreCarrera || 'la misma licenciatura',
          lugarNombre: t.Lugar?.Nombre || 'otro recinto',
          horaInicio: hIniStr,
          horaFin: hFinStr,
        };
      }
    }

    return { conflictoLugar: cLugar, conflictoCarrera: cCarrera };
  }, [fecha, horaInicio, horaFin, lugarId, carreraId, existingTrabajos, trabajoToEdit]);

  // Consulta opcional a la API para verificar disponibilidad y conflictos en base de datos en tiempo real
  const { data: disponibilidadApi } = useQuery({
    queryKey: ['disponibilidad-agenda', fecha, horaInicio, horaFin, carreraId, lugarId, trabajoToEdit?.Id_TrabajoR],
    queryFn: () =>
      trabajoService.consultarDisponibilidad({
        Fecha: fecha,
        Hora_inicio: horaInicio,
        Hora_fin: horaFin,
        Id_Carrera: carreraId,
        Id_TrabajoR: trabajoToEdit?.Id_TrabajoR,
      }),
    enabled: Boolean(isOpen && fecha && horaInicio && horaFin && horaFin > horaInicio),
    staleTime: 5000,
  });

  const conflictoCarreraFinal =
    conflictoCarrera ||
    (disponibilidadApi?.carrera && !disponibilidadApi.carrera.disponible && disponibilidadApi.carrera.conflicto
      ? {
          trabajo: null,
          Titulo: disponibilidadApi.carrera.conflicto.Titulo,
          carreraNombre: 'la misma licenciatura',
          lugarNombre: disponibilidadApi.carrera.conflicto.Lugar,
          horaInicio: disponibilidadApi.rangoHorario?.inicioLegible,
          horaFin: disponibilidadApi.rangoHorario?.finLegible,
        }
      : null);

  const conflictoLugarFinal =
    conflictoLugar ||
    (disponibilidadApi?.lugaresOcupados?.some((l) => l.Id_Lugar === lugarId)
      ? {
          trabajo: null,
          Titulo:
            disponibilidadApi.lugaresOcupados.find((l) => l.Id_Lugar === lugarId)?.ocupadoPor?.Titulo ||
            'Otro trabajo recepcional',
          lugarNombre: 'Recinto seleccionado',
          horaInicio: disponibilidadApi.rangoHorario?.inicioLegible,
          horaFin: disponibilidadApi.rangoHorario?.finLegible,
        }
      : null);

  // Mantenemos lugarConflictivo para retrocompatibilidad
  const lugarConflictivo = conflictoLugarFinal || conflictoCarreraFinal;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    // 1. Título
    const trimmedTitulo = titulo.trim();
    if (!trimmedTitulo) {
      newErrors.titulo = 'El título del trabajo recepcional es requerido.';
    } else if (trimmedTitulo.length < 5) {
      newErrors.titulo = 'El título debe tener al menos 5 caracteres.';
    } else if (trimmedTitulo.length > 255) {
      newErrors.titulo = 'El título no debe exceder los 255 caracteres.';
    } else {
      const errorMalicioso = detectarContenidoMalicioso(trimmedTitulo);
      if (errorMalicioso) {
        newErrors.titulo = errorMalicioso;
      }
    }

    // 2. Licenciatura
    if (!carreraId || Number(carreraId) <= 0) {
      newErrors.carreraId = 'Debe seleccionar una licenciatura válida.';
    }

    // 3. Modalidad
    if (!modalidad || !modalidad.trim()) {
      newErrors.modalidad = 'Debe seleccionar una modalidad válida.';
    }

    // 4. Fecha y Horarios de defensa
    if (!fecha || !fecha.trim()) {
      newErrors.fecha = 'Debe seleccionar una fecha para la defensa.';
    }
    if (!horaInicio || !horaInicio.trim()) {
      newErrors.horaInicio = 'Debe indicar la hora de inicio de la defensa.';
    }
    if (!horaFin || !horaFin.trim()) {
      newErrors.horaFin = 'Debe indicar la hora de finalización de la defensa.';
    } else if (horaInicio && horaFin <= horaInicio) {
      newErrors.horaFin = 'La hora de finalización debe ser estrictamente posterior a la hora de inicio.';
    }

    if (conflictoLugarFinal) {
      newErrors.lugar = `Recinto ocupado por "${conflictoLugarFinal.Titulo}" (${conflictoLugarFinal.horaInicio} - ${conflictoLugarFinal.horaFin}).`;
    }
    if (conflictoCarreraFinal) {
      newErrors.carreraId = `Conflicto de carrera simultánea: Ya existe una defensa programada para ${conflictoCarreraFinal.carreraNombre} el mismo día de ${conflictoCarreraFinal.horaInicio} a ${conflictoCarreraFinal.horaFin}.`;
    }

    // 5. Lugar
    if (!lugarId || Number(lugarId) <= 0) {
      newErrors.lugar = 'Debe seleccionar un recinto/lugar para la defensa.';
    }

    // 6. Estudiantes Asignados
    if (esProfesorRegistrando && sinGruposPeriodoActual) {
      newErrors.estudiantes =
        'No cuenta con un grupo de Experiencia Recepcional asignado en el periodo escolar vigente. No es posible registrar el trabajo.';
    }

    const validMatriculas = matriculasEstudiantes.filter((m) => m && m.trim() !== '');
    if (validMatriculas.length === 0) {
      newErrors.estudiantes = 'Debe asignar al menos un estudiante al trabajo recepcional.';
    } else if (matriculasEstudiantes.some((m) => !m || !m.trim())) {
      newErrors.estudiantes =
        'Todos los campos de estudiantes deben tener un estudiante seleccionado o ser eliminados.';
    } else {
      const matriculasUnicas = new Set(validMatriculas);
      if (matriculasUnicas.size !== validMatriculas.length) {
        newErrors.estudiantes = 'No puede seleccionar dos veces al mismo estudiante.';
      } else if (esProfesorRegistrando) {
        // Validación estricta para profesor: los alumnos deben pertenecer a su grupo de ER activo
        const permitidas = new Set(estudiantesGrupoActual.map((e) => e.matricula));
        const invalidas = validMatriculas.filter((m) => !permitidas.has(m));
        if (invalidas.length > 0) {
          newErrors.estudiantes = `El alumno (${invalidas.join(
            ', '
          )}) no está inscrito en tus grupos de Experiencia Recepcional del periodo escolar actual.`;
        }
      }
    }

    // 7. Comité Académico (Director, Secretario y Vocal son obligatorios; los demás son opcionales)
    if (!directorId) {
      newErrors.director = 'Debe seleccionar al Director del comité.';
    }
    if (!secretarioId) {
      newErrors.secretario = 'Debe seleccionar al Secretario del jurado.';
    }
    if (!vocalId) {
      newErrors.vocal = 'Debe seleccionar al Vocal del jurado.';
    }

    // Verificar exclusividad de profesores:
    // Regla: Cada rol debe ser un profesor distinto, excepto que el Director puede ser también el Presidente
    const rolesAsignados: { rol: string; id: string | number }[] = [];
    if (directorId) rolesAsignados.push({ rol: 'Director', id: directorId });
    if (codirectorId) rolesAsignados.push({ rol: 'Codirector', id: codirectorId });
    if (presidenteId) rolesAsignados.push({ rol: 'Presidente', id: presidenteId });
    if (secretarioId) rolesAsignados.push({ rol: 'Secretario', id: secretarioId });
    if (vocalId) rolesAsignados.push({ rol: 'Vocal', id: vocalId });
    if (sinodalId) rolesAsignados.push({ rol: 'Sinodal/Lector', id: sinodalId });

    for (let i = 0; i < rolesAsignados.length; i++) {
      for (let j = i + 1; j < rolesAsignados.length; j++) {
        const a = rolesAsignados[i];
        const b = rolesAsignados[j];
        if (String(a.id) === String(b.id)) {
          const esDirectorYPresidente =
            (a.rol === 'Director' && b.rol === 'Presidente') ||
            (a.rol === 'Presidente' && b.rol === 'Director');
          if (!esDirectorYPresidente) {
            newErrors.comite = `Un profesor no puede desempeñar simultáneamente los roles de ${a.rol} y ${b.rol}.`;
            break;
          }
        }
      }
      if (newErrors.comite) break;
    }

    if (!isFolioResultadoLocked) {
      if (tomo !== undefined && tomo !== null && tomo < 1) {
        newErrors.tomo = 'El Tomo debe ser mayor o igual a 1.';
      }
      if (
        numeroFolio !== undefined &&
        numeroFolio !== null &&
        (numeroFolio < 1 || numeroFolio > 100)
      ) {
        newErrors.numeroFolio = 'El Folio debe estar en el rango de 1 a 100.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Por favor complete todos los campos obligatorios con información válida.');
      return;
    }

    const participantes: Array<{ Numero_Personal: string | number; Id_rol: number }> = [];
    if (directorId) participantes.push({ Numero_Personal: directorId, Id_rol: 1 });
    if (codirectorId) participantes.push({ Numero_Personal: codirectorId, Id_rol: 2 });
    // Solo registrar presidente si es un profesor distinto al director para evitar duplicados en BD
    if (presidenteId && String(presidenteId) !== String(directorId)) {
      participantes.push({ Numero_Personal: presidenteId, Id_rol: 3 });
    }
    if (secretarioId) participantes.push({ Numero_Personal: secretarioId, Id_rol: 4 });
    if (vocalId) participantes.push({ Numero_Personal: vocalId, Id_rol: 5 });
    if (sinodalId) participantes.push({ Numero_Personal: sinodalId, Id_rol: 6 });

    const fechaDefensaIso = fecha && horaInicio ? `${fecha}T${horaInicio}:00` : fechaHora;
    const fechaFinDefensaIso = fecha && horaFin ? `${fecha}T${horaFin}:00` : undefined;

    const payload: GuardarTrabajoPayload = {
      Titulo: trimmedTitulo,
      Modalidad: modalidad,
      Fecha: fecha,
      Hora_inicio: horaInicio,
      Hora_fin: horaFin,
      Fecha_defensa: fechaDefensaIso,
      Fecha_fin_defensa: fechaFinDefensaIso,
      Id_Carrera: carreraId,
      Id_Lugar: lugarId,
      Folio: folio.trim() || 'Pendiente',
      Tomo: tomo !== undefined && tomo !== null ? tomo : null,
      Numero_Folio: numeroFolio !== undefined && numeroFolio !== null ? numeroFolio : null,
      Resultado: resultado.trim() || 'Pendiente',
      participantes,
      matriculasEstudiantes: validMatriculas,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      toast.error('Error al guardar el trabajo recepcional', {
        description: err.response?.data?.detalle || err.message || 'Intente nuevamente.',
      });
    }
  };

  return {
    carreraId,
    setCarreraId,
    modalidad,
    setModalidad,
    titulo,
    setTitulo,
    fecha,
    setFecha,
    horaInicio,
    setHoraInicio,
    horaFin,
    setHoraFin,
    fechaHora,
    setFechaHora,
    lugarId,
    setLugarId,
    folio,
    setFolio,
    tomo,
    setTomo,
    numeroFolio,
    setNumeroFolio,
    handleTomoChange,
    handleNumeroFolioChange,
    resultado,
    setResultado,
    matriculasEstudiantes,
    directorId,
    setDirectorId,
    codirectorId,
    setCodirectorId,
    presidenteId,
    setPresidenteId,
    secretarioId,
    setSecretarioId,
    vocalId,
    setVocalId,
    sinodalId,
    setSinodalId,
    errors,
    academicosOptions,
    estudiantesOptions,
    lugarConflictivo,
    conflictoLugar: conflictoLugarFinal,
    conflictoCarrera: conflictoCarreraFinal,
    disponibilidadApi,
    isFolioResultadoLocked,
    isJefeCarrera: esJefeCarrera,
    sinGruposPeriodoActual,
    infoGrupos,
    isLoadingGrupos,
    periodoActual,
    handleAddEstudiante,
    handleRemoveEstudiante,
    handleEstudianteChange,
    handleSubmit,
  };
};

