import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { academicoService } from '@/services/academicos/academicoService';
import { estudianteService } from '@/services/estudiantes/estudianteService';
import type { SelectOption } from '@/presentation/components/SearchableSelect';
import type { TrabajoRecepcional } from '@/domain/models/trabajo.types';
import type { GuardarTrabajoPayload } from '@/services/trabajos/trabajoService';

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
  // Estado del formulario
  const [carreraId, setCarreraId] = useState<number>(1);
  const [modalidad, setModalidad] = useState<string>('Monografía');
  const [titulo, setTitulo] = useState<string>('');
  const [fechaHora, setFechaHora] = useState<string>('');
  const [lugarId, setLugarId] = useState<number>(1);
  const [folio, setFolio] = useState<string>('Pendiente');
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

  // Cargar lista de estudiantes registrados para búsqueda activa
  const { data: estudiantes = [] } = useQuery({
    queryKey: ['estudiantes'],
    queryFn: () => estudianteService.getEstudiantes(),
    enabled: isOpen,
  });

  // Convertir académicos a opciones de Select
  const academicosOptions: SelectOption[] = useMemo(() => {
    return academicos.map((ac) => ({
      value: ac.Numero_Personal || '',
      label: `${ac.Nombre} ${ac.ApellidoP} ${ac.ApellidoM || ''}`.trim(),
      sublabel: ac.CorreoInstitucional,
    }));
  }, [academicos]);

  // Convertir estudiantes a opciones de Select
  const estudiantesOptions: SelectOption[] = useMemo(() => {
    return estudiantes.map((est) => ({
      value: est.Matricula,
      label: `${est.NombreCompleto} (${est.Matricula})`,
      sublabel: est.CorreoInstitucional,
    }));
  }, [estudiantes]);

  // Rellenar formulario cuando se abre en modo edición
  useEffect(() => {
    if (isOpen) {
      if (trabajoToEdit) {
        setTitulo(trabajoToEdit.Titulo || '');
        setModalidad(trabajoToEdit.Modalidad || 'Monografía');
        setCarreraId(trabajoToEdit.Id_Carrera || trabajoToEdit.Carrera?.Id_Carrera || 1);
        setLugarId(trabajoToEdit.Id_Lugar || trabajoToEdit.Lugar?.Id_Lugar || 1);
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

        // Cargar lista de estudiantes asignados
        const listaEstudiantes = trabajoToEdit.estudiantes || trabajoToEdit.EstudianteTrabajos || [];
        const mats = listaEstudiantes
          .map((e) => e.Matricula || e.Estudiante?.Matricula)
          .filter(Boolean) as string[];

        setMatriculasEstudiantes(mats.length > 0 ? mats : ['']);

        // Cargar participantes
        const participantes: any[] =
          (trabajoToEdit as any).participantes ||
          trabajoToEdit.ParticipantesTrabajos ||
          (trabajoToEdit as any).Participantes ||
          [];

        const findByRol = (rolId: number, nombreRol: string) => {
          const part = participantes.find(
            (p: any) =>
              p.Id_rol === rolId ||
              p.RolDeParticipacion?.Id_rol === rolId ||
              p.Rol_de_participacion?.Id_rol === rolId ||
              p.RolDeParticipacion?.NombreRol?.toLowerCase() === nombreRol.toLowerCase() ||
              p.Rol_de_participacion?.NombreRol?.toLowerCase() === nombreRol.toLowerCase()
          );
          return part?.Numero_Personal || part?.Academico?.Numero_Personal;
        };

        setDirectorId(findByRol(1, 'director'));
        setCodirectorId(findByRol(2, 'codirector'));
        setPresidenteId(findByRol(3, 'presidente'));
        setSecretarioId(findByRol(4, 'secretario'));
        setVocalId(findByRol(5, 'vocal'));
        setSinodalId(findByRol(6, 'sinodal'));
      } else {
        // Reset a valores por defecto para nuevo registro
        setTitulo('');
        setModalidad('Monografía');
        setCarreraId(1);
        setLugarId(1);
        setFechaHora('');
        setFolio('Pendiente');
        setResultado('Pendiente');
        setMatriculasEstudiantes(['']);
        setDirectorId(undefined);
        setCodirectorId(undefined);
        setPresidenteId(undefined);
        setSecretarioId(undefined);
        setVocalId(undefined);
        setSinodalId(undefined);
      }
      setErrors({});
    }
  }, [isOpen, trabajoToEdit]);

  // Reglas de negocio CU-05:
  const estadoNombreActual = trabajoToEdit?.EstadoListum?.EstadoNombre || 'Borrador';
  const isFinalizado = estadoNombreActual === 'Finalizado';
  const isAprobadoOGenerado = estadoNombreActual === 'Aprobado' || estadoNombreActual === 'Generado';
  const isFolioResultadoLocked = isAprobadoOGenerado || !isFinalizado;

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
    handleAddEstudiante,
    handleRemoveEstudiante,
    handleEstudianteChange,
    handleSubmit,
  };
};
