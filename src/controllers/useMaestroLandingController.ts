import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { trabajoService, type GuardarTrabajoPayload } from '@/services/trabajos/trabajoService';
import type { TrabajoRecepcional } from '@/domain/models/trabajo.types';
import { useAuth } from '@/context/AuthContext';
import {
  isDirectivo,
  isDirector,
  isSecretaria,
  isSecretariaGrupo,
  isPersonalAdministrativo,
  isJefeCarrera,
  isSoloProfesor,
  getUserCarreraId,
  canRecibirDocumentos,
  canGenerarActa,
  canFinalizarTrabajo,
  canValidarTrabajo,
  canEditarTrabajo,
  canEliminarTrabajo,
  canRegistrarTrabajo,
} from '@/utils/roleUtils';
import { documentoService } from '@/services/documentos/documentoService';
import { academicoService } from '@/services/academicos/academicoService';
import { cursoService } from '@/services/cursos/cursoService';
import { authService } from '@/services/auth/authService';
import { CARRERAS_OPCIONES } from '@/presentation/views/profesor/constants/trabajoCatalogos';

export type SortField = 'folio' | 'modalidad' | 'fecha';
export type SortOrder = 'asc' | 'desc';

export const useMaestroLandingController = () => {
  const { user } = useAuth();
  const userIsDirectivo = isDirectivo(user);
  const isDirectorUser = isDirector(user);
  const isSecretariaUser = isSecretaria(user);
  const isSecretariaGrupoUser = isSecretariaGrupo(user);
  const isPersonalAdmin = isPersonalAdministrativo(user);
  const isJefeCarreraUser = isJefeCarrera(user);
  const isDocenteUser = isSoloProfesor(user);

  // Consultar si el docente, director o jefe de carrera tiene grupos de ER activos en el periodo actual
  const { data: misGruposActual = [] } = useQuery({
    queryKey: ['mis-grupos-actual-controller', user?.numeroPersonal],
    queryFn: () => cursoService.getMisGrupos({ soloActual: true }),
    enabled: !!user && (isDocenteUser || isDirectorUser || isJefeCarreraUser),
  });

  // Consultar todos los grupos de ER asignados al docente (todos los periodos) para identificar qué trabajos son de sus grupos
  const { data: todosMisGrupos = [], isLoading: isLoadingTodosGrupos } = useQuery({
    queryKey: ['todos-mis-grupos-controller', user?.numeroPersonal],
    queryFn: () => cursoService.getMisGrupos({ soloActual: false }),
    enabled: !!user && isDocenteUser,
  });

  // Conjunto de matrículas de estudiantes pertenecientes a los grupos de ER del profesor
  const misMatriculasEstudiantes = useMemo(() => {
    const set = new Set<string>();
    todosMisGrupos.forEach((g) => {
      (g.estudiantes || []).forEach((e) => {
        if (e.Matricula) {
          set.add(String(e.Matricula).trim().toUpperCase());
        }
      });
    });
    return set;
  }, [todosMisGrupos]);

  const tieneGruposERActivos = misGruposActual.length > 0;
  const userCanRegistrar = canRegistrarTrabajo(user, tieneGruposERActivos);
  const userCanRecibirDocumentos = canRecibirDocumentos(user);
  const userCanGenerarActa = canGenerarActa(user);
  const userCanFinalizarTrabajo = canFinalizarTrabajo(user);
  const userCanValidarTrabajo = canValidarTrabajo(user);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Cargar lista de académicos registrados para resolver Id_Carrera del Jefe de Carrera si no está en sesión
  const { data: academicos = [] } = useQuery({
    queryKey: ['academicos'],
    queryFn: () => academicoService.getAcademicos(),
    enabled: isJefeCarreraUser,
  });

  // Determinar Id_Carrera para el usuario Jefe de Carrera
  const jefeCarreraId = useMemo(() => {
    if (!isJefeCarreraUser) return undefined;
    const directId = getUserCarreraId(user);
    if (directId) return directId;

    const currentNum =
      user?.numeroPersonal !== undefined && user?.numeroPersonal !== null
        ? String(user.numeroPersonal)
        : undefined;
    if (currentNum && academicos.length > 0) {
      const match = academicos.find(
        (a: any) => String(a.Numero_Personal ?? a.numeroPersonal) === currentNum
      );
      if (match?.Id_Carrera) {
        return Number(match.Id_Carrera);
      }
    }
    return undefined;
  }, [isJefeCarreraUser, user, academicos]);

  // Si se encontró el Id_Carrera pero no estaba almacenado en sesión, sincronizarlo
  useEffect(() => {
    if (jefeCarreraId && user && (!(user as any).Id_Carrera || !(user as any).idCarrera)) {
      const updatedUser = { ...user, Id_Carrera: jefeCarreraId, idCarrera: jefeCarreraId };
      authService.setStoredUser(updatedUser);
    }
  }, [jefeCarreraId, user]);

  const jefeCarreraNombre = useMemo(() => {
    if (!jefeCarreraId) return null;
    const opt = CARRERAS_OPCIONES.find((c) => c.id === jefeCarreraId);
    return opt?.nombre || null;
  }, [jefeCarreraId]);
  
  // Estado del modal de registro/edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trabajoToEdit, setTrabajoToEdit] = useState<TrabajoRecepcional | null>(null);

  // Estado de ordenamiento interactivo
  const [sortField, setSortField] = useState<SortField | null>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Consulta de trabajos recepcionales con participantes y alumnos desde la API
  const {
    data: trabajos = [],
    isLoading: isLoadingTrabajos,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['trabajos', user?.numeroPersonal, jefeCarreraId],
    queryFn: () =>
      trabajoService.getTrabajos({
        numeroPersonal: user?.numeroPersonal,
        Numero_Personal: user?.numeroPersonal,
        Id_Carrera: jefeCarreraId,
      }),
  });

  const isLoading = isLoadingTrabajos || (isDocenteUser && isLoadingTodosGrupos);

  // Mutación para crear trabajo
  const crearMutation = useMutation({
    mutationFn: (payload: GuardarTrabajoPayload) => trabajoService.crearTrabajo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trabajos'] });
      toast.success('Trabajo recepcional registrado', {
        description: 'Se ha creado el borrador exitosamente con sus participantes.',
      });
      setIsModalOpen(false);
    },
    onError: (err: Error) => {
      toast.error('Error al registrar trabajo', {
        description: err.message,
      });
    },
  });

  // Mutación para actualizar trabajo
  const actualizarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: GuardarTrabajoPayload }) =>
      trabajoService.actualizarTrabajo(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trabajos'] });
      toast.success('Trabajo recepcional actualizado', {
        description: 'Se han guardado las modificaciones y participantes con éxito.',
      });
      setIsModalOpen(false);
      setTrabajoToEdit(null);
    },
    onError: (err: Error) => {
      toast.error('Error al actualizar trabajo', {
        description: err.message,
      });
    },
  });

  // Mutación para enviar a validación (CU-02)
  const enviarMutation = useMutation({
    mutationFn: (id: number) => trabajoService.enviarAValidacion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trabajos'] });
      toast.success('Trabajo enviado a revisión', {
        description: 'El estado ha cambiado a "Registrado" y se encuentra en validación por Secretaría.',
      });
    },
    onError: (err: Error) => {
      toast.error('No se pudo enviar el trabajo', {
        description: err.message,
      });
    },
  });

  // Mutación para eliminar trabajo en borrador (FA-03)
  const eliminarMutation = useMutation({
    mutationFn: (id: number) => trabajoService.eliminarTrabajo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trabajos'] });
      toast.success('Trabajo eliminado', {
        description: 'El registro ha sido eliminado exitosamente.',
      });
    },
    onError: (err: Error) => {
      toast.error('No se pudo eliminar el trabajo', {
        description: err.message,
      });
    },
  });

  // Mutación para validar / aprobar trabajo (CU-03)
  const validarMutation = useMutation({
    mutationFn: (id: number) => trabajoService.validarTrabajo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trabajos'] });
      toast.success('Trabajo recepcional aprobado con éxito', {
        description: 'El registro ha pasado al estado "Aprobado".',
      });
    },
    onError: (err: Error) => {
      toast.error('Error al validar el trabajo recepcional', {
        description: err.message,
      });
    },
  });

  // Mutación para rechazar trabajo (CU-04)
  const rechazarMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo?: string }) =>
      trabajoService.rechazarTrabajo(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trabajos'] });
      toast.success('Trabajo recepcional rechazado', {
        description: 'El registro ha vuelto a estado "Borrador" para corrección por el profesor.',
      });
    },
    onError: (err: Error) => {
      toast.error('Error al rechazar el trabajo recepcional', {
        description: err.message,
      });
    },
  });

  // Alternar ordenamiento por columna
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtro y ordenamiento dinámico
  const filteredAndSortedTrabajos = useMemo(() => {
    let result = [...trabajos];

    // Si el usuario es directivo o secretaria de grupo, no se deben mostrar los trabajos en estado Borrador
    // (a menos que sea el docente titular que registró su propio borrador en su grupo de ER)
    if (isPersonalAdmin) {
      const userNum = String(user?.numeroPersonal ?? '').trim();
      result = result.filter((t) => {
        const estado = t.EstadoListum?.EstadoNombre || 'Borrador';
        if (estado !== 'Borrador') return true;
        if (userNum) {
          const esPropioBorrador = (t.academicos || t.ParticipantesTrabajos || []).some((p: any) => {
            const num = String(p.Academico?.Numero_Personal ?? p.Numero_Personal ?? '').trim();
            return num === userNum;
          });
          if (esPropioBorrador) return true;
        }
        return false;
      });
    }

    // Regla de Visibilidad estricta para Jefe de Carrera:
    // Solo puede ver los trabajos pertenecientes a su licenciatura (Id_Carrera)
    if (isJefeCarreraUser && jefeCarreraId) {
      result = result.filter((t) => {
        const carreraIdTrabajo = t.Id_Carrera || t.Carrera?.Id_Carrera;
        if (carreraIdTrabajo !== undefined && carreraIdTrabajo !== null) {
          return Number(carreraIdTrabajo) === Number(jefeCarreraId);
        }
        if (jefeCarreraNombre && t.Carrera?.NombreCarrera) {
          return t.Carrera.NombreCarrera.toLowerCase().trim() === jefeCarreraNombre.toLowerCase().trim();
        }
        return false;
      });
    }

    // Regla de Visibilidad estricta para Profesor:
    // El profesor no debe ver trabajos recepcionales que sean de otros grupos de la clase de Experiencia Recepcional que no sean los suyos.
    if (isDocenteUser) {
      const userNum = String(user?.numeroPersonal ?? (user as any)?.Numero_Personal ?? '').trim();
      result = result.filter((t) => {
        // 1. Trabajos que incluyan al menos un estudiante inscrito en alguno de los grupos de ER del docente
        const tieneEstudianteDeMiGrupo = (t.estudiantes || t.EstudianteTrabajos || []).some((e: any) => {
          const mat = String(e.Matricula ?? e.Estudiante?.Matricula ?? '').trim().toUpperCase();
          return mat !== '' && misMatriculasEstudiantes.has(mat);
        });

        if (tieneEstudianteDeMiGrupo) return true;

        // 2. Trabajos en borrador registrados por este docente en su grupo
        const estado = t.EstadoListum?.EstadoNombre || 'Borrador';
        if (estado === 'Borrador' && userNum) {
          const esPropioBorrador = (t.academicos || t.ParticipantesTrabajos || []).some((p: any) => {
            const num = String(p.Academico?.Numero_Personal ?? p.Numero_Personal ?? '').trim();
            return num === userNum;
          });
          if (esPropioBorrador) return true;
        }

        return false;
      });
    }

    // 1. Filtrado por término de búsqueda
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter((t) => {
        const matchTitulo = t.Titulo?.toLowerCase().includes(term);
        const matchCarrera = t.Carrera?.NombreCarrera?.toLowerCase().includes(term);
        const matchModalidad = t.Modalidad?.toLowerCase().includes(term);
        const matchFolio =
          t.Folio?.toLowerCase().includes(term) ||
          (t.Tomo !== undefined && t.Tomo !== null && `tomo ${t.Tomo}`.includes(term)) ||
          (t.Numero_Folio !== undefined && t.Numero_Folio !== null && `folio ${t.Numero_Folio}`.includes(term)) ||
          (t.Tomo !== undefined && t.Tomo !== null && String(t.Tomo) === term) ||
          (t.Numero_Folio !== undefined && t.Numero_Folio !== null && String(t.Numero_Folio) === term);
        const matchEstado = t.EstadoListum?.EstadoNombre?.toLowerCase().includes(term);
        
        // Búsqueda en estudiantes
        const matchAlumno = (t.estudiantes || t.EstudianteTrabajos)?.some((e) =>
          e.Estudiante?.NombreCompleto?.toLowerCase().includes(term) ||
          e.Estudiante?.Matricula?.toLowerCase().includes(term)
        );

        // Búsqueda en profesores
        const matchProfesor = (t.academicos || t.ParticipantesTrabajos)?.some((p) => {
          const fullName = `${p.Academico?.Nombre || ''} ${p.Academico?.ApellidoP || ''} ${p.Academico?.ApellidoM || ''}`.toLowerCase();
          const rol = (p.RolDeParticipacion?.NombreRol || p.Rol_de_participacion?.NombreRol || '').toLowerCase();
          return fullName.includes(term) || rol.includes(term);
        });

        return (
          matchTitulo ||
          matchCarrera ||
          matchModalidad ||
          matchFolio ||
          matchEstado ||
          matchAlumno ||
          matchProfesor
        );
      });
    }

    // 2. Ordenamiento interactivo por columna
    result.sort((a, b) => {
      if (sortField === 'fecha') {
        const dateA = a.Fecha_defensa ? new Date(a.Fecha_defensa).getTime() : 0;
        const dateB = b.Fecha_defensa ? new Date(b.Fecha_defensa).getTime() : 0;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }

      if (sortField === 'folio') {
        // Ordenamiento jerárquico por Tomo y Número de Folio
        const tomoA = a.Tomo ?? (a.Folio?.toLowerCase().includes('tomo') ? parseInt(a.Folio.replace(/[^0-9]/g, ''), 10) : 0);
        const tomoB = b.Tomo ?? (b.Folio?.toLowerCase().includes('tomo') ? parseInt(b.Folio.replace(/[^0-9]/g, ''), 10) : 0);
        const numFolioA = a.Numero_Folio ?? 0;
        const numFolioB = b.Numero_Folio ?? 0;

        if (tomoA || tomoB || numFolioA || numFolioB) {
          const scoreA = (tomoA || 0) * 1000 + (numFolioA || 0);
          const scoreB = (tomoB || 0) * 1000 + (numFolioB || 0);
          return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
        }

        const valA = (a.Folio || '').trim();
        const valB = (b.Folio || '').trim();
        
        const numA = parseInt(valA, 10);
        const numB = parseInt(valB, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortOrder === 'asc' ? numA - numB : numB - numA;
        }

        if (valA === 'Pendiente' && valB !== 'Pendiente') return 1;
        if (valB === 'Pendiente' && valA !== 'Pendiente') return -1;

        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (sortField === 'modalidad') {
        const modA = a.Modalidad || '';
        const modB = b.Modalidad || '';
        return sortOrder === 'asc' ? modA.localeCompare(modB) : modB.localeCompare(modA);
      }

      return (b.Id_TrabajoR || 0) - (a.Id_TrabajoR || 0);
    });

    return result;
  }, [
    trabajos,
    searchTerm,
    sortField,
    sortOrder,
    isPersonalAdmin,
    isJefeCarreraUser,
    jefeCarreraId,
    jefeCarreraNombre,
    isDocenteUser,
    misMatriculasEstudiantes,
    user?.numeroPersonal,
  ]);

  // Estado del cuadro de diálogo de confirmación in-app
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleCloseConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  // Acciones
  const handleEnviar = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar envío a revisión',
      message:
        '¿Está seguro de que desea enviar este trabajo recepcional a revisión? El estado cambiará a "Registrado" y no podrá modificarse.',
      confirmText: 'Enviar a revisión',
      cancelText: 'Cancelar',
      variant: 'primary',
      onConfirm: () => {
        enviarMutation.mutate(id);
        handleCloseConfirmDialog();
      },
    });
  };

  const handleEliminar = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar eliminación',
      message:
        '¿Está seguro de que desea eliminar este trabajo recepcional? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
      onConfirm: () => {
        eliminarMutation.mutate(id);
        handleCloseConfirmDialog();
      },
    });
  };

  const handleEditar = (trabajo: TrabajoRecepcional) => {
    setTrabajoToEdit(trabajo);
    setIsModalOpen(true);
  };

  // Validar / Aceptar trabajo recepcional (CU-03)
  const handleAceptar = (trabajo: TrabajoRecepcional) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Validar Trabajo Recepcional',
      message: `¿Estás seguro de que deseas aceptar el trabajo "${trabajo.Titulo}" con folio ${trabajo.Folio || 'Pendiente'}? El estado pasará a "Aprobado".`,
      confirmText: 'Aceptar y Validar',
      cancelText: 'Cancelar',
      variant: 'primary',
      onConfirm: () => {
        validarMutation.mutate(trabajo.Id_TrabajoR);
        handleCloseConfirmDialog();
      },
    });
  };

  // Rechazar trabajo recepcional (CU-04)
  const handleRechazar = (trabajo: TrabajoRecepcional) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Rechazar Trabajo Recepcional',
      message: `¿Estás seguro de que deseas rechazar el trabajo "${trabajo.Titulo}"? El registro volverá al estado "Borrador" para que el profesor responsable realice las correcciones pertinentes.`,
      confirmText: 'Rechazar trabajo',
      cancelText: 'Cancelar',
      variant: 'danger',
      onConfirm: () => {
        rechazarMutation.mutate({ id: trabajo.Id_TrabajoR });
        handleCloseConfirmDialog();
      },
    });
  };

  // Estado del modal de recepción de documentos (CU-06)
  const [isDocumentosModalOpen, setIsDocumentosModalOpen] = useState(false);
  const [trabajoParaDocumentos, setTrabajoParaDocumentos] = useState<TrabajoRecepcional | null>(null);

  const handleAbrirDocumentos = (trabajo: TrabajoRecepcional) => {
    setTrabajoParaDocumentos(trabajo);
    setIsDocumentosModalOpen(true);
  };

  const handleCerrarDocumentos = () => {
    setIsDocumentosModalOpen(false);
    setTrabajoParaDocumentos(null);
  };

  // Estado del modal para generar acta (Asignación de Libro/Tomo y Folio Oficial)
  const [isGenerarActaModalOpen, setIsGenerarActaModalOpen] = useState(false);
  const [trabajoParaActa, setTrabajoParaActa] = useState<TrabajoRecepcional | null>(null);

  const handleAbrirGenerarActa = (trabajo: TrabajoRecepcional) => {
    setTrabajoParaActa(trabajo);
    setIsGenerarActaModalOpen(true);
  };

  const handleCerrarGenerarActa = () => {
    setIsGenerarActaModalOpen(false);
    setTrabajoParaActa(null);
  };

  // Mutación para generar acta (CU-06) con asignación de Tomo y Folio
  const generarActaMutation = useMutation({
    mutationFn: ({
      id,
      tomo,
      numeroFolio,
      folio,
    }: {
      id: number;
      tomo?: string | number | null;
      numeroFolio?: string | number | null;
      folio?: string;
    }) =>
      documentoService.generarActa(id, {
        tomo,
        numeroFolio,
        folio,
        numeroPersonal: user?.numeroPersonal,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trabajos'] });
      toast.success('Acta generada exitosamente', {
        description: 'El trabajo recepcional ha pasado al estado "Generado" y se asignaron el tomo y folio oficiales.',
      });
      setIsGenerarActaModalOpen(false);
      setTrabajoParaActa(null);
    },
    onError: (err: any) => {
      toast.error('Error al generar el acta', {
        description: err.response?.data?.detalle || err.message,
      });
    },
  });

  const handleGenerarActa = (trabajo: TrabajoRecepcional) => {
    handleAbrirGenerarActa(trabajo);
  };

  const handleGenerarActaSubmit = async (payload: {
    tomo: string;
    numeroFolio: string;
    folio: string;
  }) => {
    if (!trabajoParaActa) return;
    await generarActaMutation.mutateAsync({
      id: trabajoParaActa.Id_TrabajoR,
      tomo: payload.tomo,
      numeroFolio: payload.numeroFolio,
      folio: payload.folio,
    });
  };

  // Estado del modal para finalizar trabajo (Asignación de Folio y Resultado)
  const [isFinalizarModalOpen, setIsFinalizarModalOpen] = useState(false);
  const [trabajoParaFinalizar, setTrabajoParaFinalizar] = useState<TrabajoRecepcional | null>(null);

  const handleAbrirFinalizar = (trabajo: TrabajoRecepcional) => {
    setTrabajoParaFinalizar(trabajo);
    setIsFinalizarModalOpen(true);
  };

  const handleCerrarFinalizar = () => {
    setIsFinalizarModalOpen(false);
    setTrabajoParaFinalizar(null);
  };

  // Mutación para finalizar trabajo recepcional
  const finalizarMutation = useMutation({
    mutationFn: ({
      id,
      tomo,
      numeroFolio,
      folio,
      resultado,
    }: {
      id: number;
      tomo?: number | null;
      numeroFolio?: number | null;
      folio: string;
      resultado: string;
    }) =>
      trabajoService.finalizarTrabajo(id, {
        Tomo: tomo,
        Numero_Folio: numeroFolio,
        Folio: folio,
        Resultado: resultado,
        Numero_Personal: user?.numeroPersonal,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trabajos'] });
      toast.success('Trabajo recepcional finalizado con éxito', {
        description: 'Se ha asignado el libro, folio de acta y el resultado. El estado ha cambiado a "Finalizado".',
      });
      setIsFinalizarModalOpen(false);
      setTrabajoParaFinalizar(null);
    },
    onError: (err: any) => {
      toast.error('Error al finalizar el trabajo recepcional', {
        description: err.response?.data?.detalle || err.message,
      });
    },
  });

  const handleFinalizarSubmit = async (payload: {
    tomo?: string | number | null;
    numeroFolio?: string | number | null;
    folio: string;
    resultado: string;
  }) => {
    if (!trabajoParaFinalizar) return;
    const tNum =
      payload.tomo !== undefined && payload.tomo !== null && payload.tomo !== ''
        ? Number(payload.tomo)
        : null;
    const fNum =
      payload.numeroFolio !== undefined && payload.numeroFolio !== null && payload.numeroFolio !== ''
        ? Number(payload.numeroFolio)
        : null;

    await finalizarMutation.mutateAsync({
      id: trabajoParaFinalizar.Id_TrabajoR,
      tomo: tNum !== null && !isNaN(tNum) ? tNum : null,
      numeroFolio: fNum !== null && !isNaN(fNum) ? fNum : null,
      folio: payload.folio,
      resultado: payload.resultado,
    });
  };


  const handleRegistrar = () => {
    setTrabajoToEdit(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTrabajoToEdit(null);
  };

  const handleSaveTrabajo = async (payload: GuardarTrabajoPayload) => {
    if (trabajoToEdit) {
      await actualizarMutation.mutateAsync({ id: trabajoToEdit.Id_TrabajoR, payload });
    } else {
      await crearMutation.mutateAsync(payload);
    }
  };

  const subtituloVista = useMemo(() => {
    if (isDirectorUser) {
      return 'Dirección de la Facultad — Supervisión General de Trabajos Recepcionales';
    }
    if (isJefeCarreraUser) {
      return jefeCarreraNombre
        ? `Licenciatura en ${jefeCarreraNombre} — Supervisión Académica`
        : 'Jefatura de Carrera — Supervisión Académica';
    }
    if (isSecretariaUser) {
      return 'Secretaría Académica — Control Documental y Actas';
    }
    if (isSecretariaGrupoUser) {
      return 'Secretaría de Grupo — Control Documental y Actas';
    }
    if (isDocenteUser) {
      if (todosMisGrupos.length > 0) {
        const nrcs = todosMisGrupos.map((g) => g.curso?.NRC).filter(Boolean).join(', ');
        return `Experiencia Recepcional — Grupo(s) a cargo: NRC ${nrcs}`;
      }
      return 'Experiencia Recepcional — Sin grupos asignados en el periodo actual';
    }
    return 'Experiencia Recepcional';
  }, [
    isDirectorUser,
    isJefeCarreraUser,
    jefeCarreraNombre,
    isSecretariaUser,
    isSecretariaGrupoUser,
    isDocenteUser,
    todosMisGrupos,
  ]);

  return {
    subtituloVista,
    trabajos: filteredAndSortedTrabajos,
    rawTrabajos: trabajos,
    totalCount: filteredAndSortedTrabajos.length,
    isLoading,
    isError,
    error,
    searchTerm,
    setSearchTerm,
    sortField,
    sortOrder,
    handleSort,
    handleEnviar,
    handleEliminar,
    handleEditar,
    handleRegistrar,
    handleAceptar,
    handleRechazar,
    handleAbrirDocumentos,
    handleCerrarDocumentos,
    handleGenerarActa,
    handleAbrirFinalizar,
    handleCerrarFinalizar,
    handleFinalizarSubmit,
    isSending: enviarMutation.isPending,
    isDeleting: eliminarMutation.isPending,
    isValidating: validarMutation.isPending,
    isRejecting: rechazarMutation.isPending,
    isGenerandoActa: generarActaMutation.isPending,
    isFinalizando: finalizarMutation.isPending,
    isSaving: crearMutation.isPending || actualizarMutation.isPending,
    refetch,
    // Modal states
    isModalOpen,
    trabajoToEdit,
    handleCloseModal,
    handleSaveTrabajo,
    // Generar Acta Modal states
    isGenerarActaModalOpen,
    trabajoParaActa,
    handleCerrarGenerarActa,
    handleGenerarActaSubmit,
    // Finalizar Modal states
    isFinalizarModalOpen,
    trabajoParaFinalizar,
    // Documentos Modal states
    isDocumentosModalOpen,
    trabajoParaDocumentos,
    // Confirm Dialog states
    confirmDialog,
    handleCloseConfirmDialog,
    userIsDirectivo,
    isDirectorUser,
    isSecretariaUser,
    isSecretariaGrupoUser,
    isJefeCarreraUser,
    jefeCarreraId,
    jefeCarreraNombre,
    userNumeroPersonal: user?.numeroPersonal,
    tieneGruposERActivos,
    userCanRegistrar,
    userCanRecibirDocumentos,
    userCanGenerarActa,
    userCanFinalizarTrabajo,
    userCanValidarTrabajo,
    canEditarTrabajo: (estado?: string, trabajo?: TrabajoRecepcional | null) => {
      const userNum = String(user?.numeroPersonal ?? '').trim();
      const esPropio = !!(
        userNum &&
        trabajo &&
        (trabajo.academicos || trabajo.ParticipantesTrabajos || []).some((p: any) => {
          const num = String(p.Academico?.Numero_Personal ?? p.Numero_Personal ?? '').trim();
          return num === userNum;
        })
      );
      return canEditarTrabajo(user, estado, esPropio);
    },
    canEliminarTrabajo: (estado?: string, trabajo?: TrabajoRecepcional | null) => {
      const userNum = String(user?.numeroPersonal ?? '').trim();
      const esPropio = !!(
        userNum &&
        trabajo &&
        (trabajo.academicos || trabajo.ParticipantesTrabajos || []).some((p: any) => {
          const num = String(p.Academico?.Numero_Personal ?? p.Numero_Personal ?? '').trim();
          return num === userNum;
        })
      );
      return canEliminarTrabajo(user, estado, esPropio);
    },
  };
};
