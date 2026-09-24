import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { academicoService } from '@/services/academicos/academicoService';
import { estudianteService } from '@/services/estudiantes/estudianteService';
import { trabajoService, type GuardarTrabajoPayload } from '@/services/trabajos/trabajoService';
import { cursoService } from '@/services/cursos/cursoService';
import { useAuth } from '@/context/AuthContext';
import { isDirectivo, isJefeCarrera, getUserCarreraId } from '@/utils/roleUtils';
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
  const esDirectivo = isDirectivo(user);
  const esJefeCarrera = isJefeCarrera(user);
  const userCarreraId = getUserCarreraId(user);
  const esProfesorRegistrando = !esDirectivo && !trabajoToEdit;

  // Estado del formulario
  const [carreraId, setCarreraId] = useState<number>(userCarreraId || 1);
  const [modalidad, setModalidad] = useState<string>('Monografía');
  const [titulo, setTitulo] = useState<string>('');
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
    enabled: isOpen && (esDirectivo || !!trabajoToEdit),
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
          const rawFecha = trabajoToEdit.Fecha_defensa;
          if (rawFecha.includes('T')) {
            setFechaHora(rawFecha.substring(0, 16));
          } else {
            setFechaHora(`${rawFecha.replace(' ', 'T').substring(0, 16)}`);
          }
        } else {
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
        setFechaHora('');
        setTomo(undefined);
        setNumeroFolio(undefined);
        setFolio('Pendiente');
        setResultado('Pendiente');
        setMatriculasEstudiantes(['']);
        // Si el usuario es docente, preasignarlo como Director del trabajo
        const titularDirector = !esDirectivo && user?.numeroPersonal ? String(user.numeroPersonal) : undefined;
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

  // Validación de conflicto de horario y lugar
  const lugarConflictivo = useMemo(() => {
    if (!fechaHora || fechaHora.length < 16 || !lugarId) return null;

    const [selDate, selTime] = fechaHora.split('T');
    if (!selDate || !selTime) return null;

    const editId = trabajoToEdit
      ? String(trabajoToEdit.Id_TrabajoR || (trabajoToEdit as any).id || '')
      : null;

    const conflicto = existingTrabajos.find((t) => {
      const otherId = String(t.Id_TrabajoR || (t as any).id || '');
      if (editId && otherId && editId === otherId) {
        return false;
      }

      const tLugarId = Number(t.Id_Lugar || t.Lugar?.Id_Lugar);
      if (tLugarId !== Number(lugarId)) {
        return false;
      }

      if (!t.Fecha_defensa) return false;

      const tFormatted = formatToDateTimeLocal(t.Fecha_defensa);
      const [tDate, tTime] = tFormatted.split('T');

      return tDate === selDate && tTime === selTime;
    });

    return conflicto;
  }, [fechaHora, lugarId, existingTrabajos, trabajoToEdit]);

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

    // 4. Fecha y Hora
    if (!fechaHora || !fechaHora.trim()) {
      newErrors.fechaHora = 'Debe seleccionar una fecha y hora para la defensa.';
    } else if (isNaN(new Date(fechaHora).getTime())) {
      newErrors.fechaHora = 'La fecha y hora seleccionada no es válida.';
    } else if (lugarConflictivo) {
      newErrors.lugar = `Recinto ocupado por "${lugarConflictivo.Titulo}" en esa fecha y hora.`;
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

    // 7. Comité Académico (Todos los roles requeridos y exclusivos)
    if (!directorId) {
      newErrors.director = 'Debe seleccionar al Director del comité.';
    }
    if (!codirectorId) {
      newErrors.codirector = 'Debe seleccionar al Codirector del comité.';
    }
    if (!presidenteId) {
      newErrors.presidente = 'Debe seleccionar al Presidente del jurado.';
    }
    if (!secretarioId) {
      newErrors.secretario = 'Debe seleccionar al Secretario del jurado.';
    }
    if (!vocalId) {
      newErrors.vocal = 'Debe seleccionar al Vocal del jurado.';
    }
    if (!sinodalId) {
      newErrors.sinodal = 'Debe seleccionar al Sinodal del jurado.';
    }

    // Verificar exclusividad de profesores
    const participantesSeleccionados = [
      directorId,
      codirectorId,
      presidenteId,
      secretarioId,
      vocalId,
      sinodalId,
    ].filter((id): id is string | number => id !== undefined && id !== '');

    const profesoresUnicos = new Set(participantesSeleccionados.map(String));
    if (profesoresUnicos.size !== participantesSeleccionados.length) {
      newErrors.comite =
        'Un profesor no puede desempeñar múltiples roles en el mismo trabajo recepcional.';
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
    if (presidenteId) participantes.push({ Numero_Personal: presidenteId, Id_rol: 3 });
    if (secretarioId) participantes.push({ Numero_Personal: secretarioId, Id_rol: 4 });
    if (vocalId) participantes.push({ Numero_Personal: vocalId, Id_rol: 5 });
    if (sinodalId) participantes.push({ Numero_Personal: sinodalId, Id_rol: 6 });

    const payload: GuardarTrabajoPayload = {
      Titulo: trimmedTitulo,
      Modalidad: modalidad,
      Fecha_defensa: fechaHora,
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
        description: err.message || 'Intente nuevamente.',
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
