import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { trabajoService, type GuardarTrabajoPayload } from '@/services/trabajos/trabajoService';
import type { TrabajoRecepcional } from '@/domain/models/trabajo.types';
import { useAuth } from '@/context/AuthContext';
import { isDirectivo, isSecretariaGrupo, isPersonalAdministrativo } from '@/utils/roleUtils';
import { documentoService } from '@/services/documentos/documentoService';

export type SortField = 'folio' | 'modalidad' | 'fecha';
export type SortOrder = 'asc' | 'desc';

export const useMaestroLandingController = () => {
  const { user } = useAuth();
  const userIsDirectivo = isDirectivo(user);
  const isSecretariaGrupoUser = isSecretariaGrupo(user);
  const isPersonalAdmin = isPersonalAdministrativo(user);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado del modal de registro/edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trabajoToEdit, setTrabajoToEdit] = useState<TrabajoRecepcional | null>(null);

  // Estado de ordenamiento interactivo
  const [sortField, setSortField] = useState<SortField | null>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Consulta de trabajos recepcionales con participantes y alumnos desde la API
  const {
    data: trabajos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['trabajos'],
    queryFn: () => trabajoService.getTrabajos(),
  });

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
    if (isPersonalAdmin) {
      result = result.filter(
        (t) => (t.EstadoListum?.EstadoNombre || 'Borrador') !== 'Borrador'
      );
    }

    // 1. Filtrado por término de búsqueda
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter((t) => {
        const matchTitulo = t.Titulo?.toLowerCase().includes(term);
        const matchCarrera = t.Carrera?.NombreCarrera?.toLowerCase().includes(term);
        const matchModalidad = t.Modalidad?.toLowerCase().includes(term);
        const matchFolio = t.Folio?.toLowerCase().includes(term);
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
  }, [trabajos, searchTerm, sortField, sortOrder, isPersonalAdmin]);

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

  // Mutación para generar acta (CU-06)
  const generarActaMutation = useMutation({
    mutationFn: (id: number) => documentoService.generarActa(id, user?.numeroPersonal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trabajos'] });
      toast.success('Acta generada exitosamente', {
        description: 'El trabajo recepcional ha pasado al estado "Generado".',
      });
    },
    onError: (err: any) => {
      toast.error('Error al generar el acta', {
        description: err.response?.data?.detalle || err.message,
      });
    },
  });

  const handleGenerarActa = (trabajo: TrabajoRecepcional) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Generar Acta de Trabajo Recepcional (CU-06)',
      message: `¿Confirma que el trabajo recepcional "${trabajo.Titulo}" ya cuenta con su acta generada? El estado cambiará a "Generado".`,
      confirmText: 'Generar Acta',
      cancelText: 'Cancelar',
      variant: 'primary',
      onConfirm: () => {
        generarActaMutation.mutate(trabajo.Id_TrabajoR);
        handleCloseConfirmDialog();
      },
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
    mutationFn: ({ id, folio, resultado }: { id: number; folio: string; resultado: string }) =>
      trabajoService.finalizarTrabajo(id, {
        Folio: folio,
        Resultado: resultado,
        Numero_Personal: user?.numeroPersonal,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trabajos'] });
      toast.success('Trabajo recepcional finalizado con éxito', {
        description: 'Se ha asignado el folio de acta y el resultado. El estado ha cambiado a "Finalizado".',
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

  const handleFinalizarSubmit = async (folio: string, resultado: string) => {
    if (!trabajoParaFinalizar) return;
    await finalizarMutation.mutateAsync({
      id: trabajoParaFinalizar.Id_TrabajoR,
      folio,
      resultado,
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

  return {
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
    isSecretariaGrupoUser,
    userNumeroPersonal: user?.numeroPersonal,
  };
};
