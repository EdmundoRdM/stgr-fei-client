import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Calendar, MapPin, AlertCircle, Plus, Trash2, GraduationCap, Lock, CheckCircle2 } from 'lucide-react';

import { academicoService } from '@/services/academicos/academicoService';
import { estudianteService } from '@/services/estudiantes/estudianteService';
import { SearchableSelect, type SelectOption } from '@/presentation/components/SearchableSelect';
import type { TrabajoRecepcional } from '@/domain/models/trabajo.types';
import type { GuardarTrabajoPayload } from '@/services/trabajos/trabajoService';

interface TrabajoModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: GuardarTrabajoPayload) => Promise<void>;
  onFinalizar?: (folio: string, resultado: string) => Promise<void>;
  isFinalizarMode?: boolean;
  trabajoToEdit?: TrabajoRecepcional | null;
  existingTrabajos?: TrabajoRecepcional[];
  isLoading?: boolean;
}

// Catálogos institucionales
const CARRERAS_OPCIONES = [
  { id: 1, nombre: 'Ingeniería de Software' },
  { id: 2, nombre: 'Ciencia de Datos' },
  { id: 3, nombre: 'Redes y Servicios de Cómputo' },
  { id: 4, nombre: 'Tecnologías de la Información' },
];

const MODALIDADES_OPCIONES = [
  'Monografía',
  'Práctico Técnico',
  'Tesis',
  'Tesina',
  'Reporte Técnico',
];

// Opciones de resultado institucional
const RESULTADOS_OPCIONES = [
  'Pendiente',
  'APROBADA POR UNANIMIDAD',
  'APROBADA POR UNANIMIDAD CON MENCIÓN DE HONOR',
  'APROBADA POR MAYORÍA',
  'NO APROBADA',
];

// Catálogo de lugares (solo los que tienen Estado 'disponible')
const LUGARES_DISPONIBLES = [
  { id: 1, nombre: 'Auditorio FEI' },
  { id: 2, nombre: 'Salon Cristal' },
  { id: 3, nombre: 'Salon Murales' },
  { id: 4, nombre: 'Audiovisual' },
];

// Helper para formatear cualquier fecha proveniente de la API al formato estricto de datetime-local (YYYY-MM-DDTHH:mm)
const formatToDateTimeLocal = (fechaRaw?: string | null): string => {
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

export const TrabajoModalForm: React.FC<TrabajoModalFormProps> = ({
  isOpen,
  onClose,
  onSave,
  onFinalizar,
  isFinalizarMode = false,
  trabajoToEdit,
  existingTrabajos = [],
  isLoading = false,
}) => {
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
        if (isFinalizarMode) {
          setFolio(trabajoToEdit.Folio && trabajoToEdit.Folio !== 'Pendiente' ? trabajoToEdit.Folio : '');
          setResultado(trabajoToEdit.Resultado && trabajoToEdit.Resultado !== 'Pendiente' ? trabajoToEdit.Resultado : 'APROBADA POR UNANIMIDAD');
        } else {
          setFolio(trabajoToEdit.Folio || 'Pendiente');
          setResultado(trabajoToEdit.Resultado || 'Pendiente');
        }

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
        const participantes = trabajoToEdit.academicos || trabajoToEdit.ParticipantesTrabajos || [];

        // Buscar por rol
        const findByRol = (rolId: number, nombreRol: string) => {
          const part = participantes.find(
            (p) =>
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
  // Para los estados Aprobado y Generado, Folio y Resultado se encuentran bloqueados.
  // Para el estado Finalizado, todas las opciones son editables.
  // En nuevo registro o borrador/registrado, Folio y Resultado son informativos ("Pendiente").
  const estadoNombreActual = trabajoToEdit?.EstadoListum?.EstadoNombre || 'Borrador';
  const isFinalizado = estadoNombreActual === 'Finalizado';
  const isAprobadoOGenerado = estadoNombreActual === 'Aprobado' || estadoNombreActual === 'Generado';
  const isFolioResultadoLocked = isFinalizarMode ? false : isAprobadoOGenerado || !isFinalizado;

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

  // Validación de conflicto de horario y lugar (evitando falso positivo con el trabajo en edición)
  const lugarConflictivo = useMemo(() => {
    if (!fechaHora || fechaHora.length < 16 || !lugarId) return null;

    // Normalizar la fecha y hora seleccionada (formato YYYY-MM-DDTHH:mm)
    const [selDate, selTime] = fechaHora.split('T');
    if (!selDate || !selTime) return null;

    const editId = trabajoToEdit
      ? String(trabajoToEdit.Id_TrabajoR || (trabajoToEdit as any).id || '')
      : null;

    const conflicto = existingTrabajos.find((t) => {
      // Ignorar estrictamente el trabajo que estamos editando
      const otherId = String(t.Id_TrabajoR || (t as any).id || '');
      if (editId && otherId && editId === otherId) {
        return false;
      }

      // Verificar si coincide el recinto (Lugar)
      const tLugarId = Number(t.Id_Lugar || t.Lugar?.Id_Lugar);
      if (tLugarId !== Number(lugarId)) {
        return false;
      }

      if (!t.Fecha_defensa) return false;

      // Parsear fecha y hora del otro trabajo
      const tFormatted = formatToDateTimeLocal(t.Fecha_defensa);
      const [tDate, tTime] = tFormatted.split('T');

      // Solo hay conflicto si coincide la MISMA FECHA Y LA MISMA HORA
      const coincideFecha = tDate === selDate;
      const coincideHora = tTime === selTime;

      return coincideFecha && coincideHora;
    });

    return conflicto;
  }, [fechaHora, lugarId, existingTrabajos, trabajoToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isFinalizarMode) {
      const finalizeErrors: { [key: string]: string } = {};
      if (!folio.trim() || folio.trim().toLowerCase() === 'pendiente') {
        finalizeErrors.folio = 'Debe registrar un folio oficial de acta válido para finalizar';
      }
      if (!resultado || resultado.trim() === 'Pendiente') {
        finalizeErrors.resultado = 'Debe seleccionar el resultado oficial obtenido en la defensa';
      }
      if (Object.keys(finalizeErrors).length > 0) {
        setErrors(finalizeErrors);
        toast.error('Complete el folio del acta y el resultado obtenido para finalizar');
        return;
      }
      if (onFinalizar) {
        try {
          await onFinalizar(folio.trim(), resultado.trim());
          onClose();
        } catch (err: any) {
          toast.error('Error al finalizar el trabajo recepcional', {
            description: err.message || 'Intente nuevamente.',
          });
        }
      }
      return;
    }

    const newErrors: { [key: string]: string } = {};

    if (!titulo.trim()) {
      newErrors.titulo = 'El título del trabajo recepcional es requerido';
    }

    if (!fechaHora) {
      newErrors.fechaHora = 'Debe seleccionar una fecha y hora para la defensa';
    }

    if (lugarConflictivo) {
      newErrors.lugar = `Recinto ocupado por "${lugarConflictivo.Titulo}" en esa fecha y hora.`;
    }

    // Filtrar estudiantes con matrícula no vacía
    const validMatriculas = matriculasEstudiantes.filter((m) => m && m.trim() !== '');

    // Verificar que no existan matrículas duplicadas
    const matriculasUnicas = new Set(validMatriculas);
    if (matriculasUnicas.size !== validMatriculas.length) {
      newErrors.estudiantes = 'No puede seleccionar dos veces al mismo estudiante.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Por favor complete los campos obligatorios o corrija los errores');
      return;
    }

    // Armar lista de participantes seleccionados
    const participantes: Array<{ Numero_Personal: string | number; Id_rol: number }> = [];
    if (directorId) participantes.push({ Numero_Personal: directorId, Id_rol: 1 });
    if (codirectorId) participantes.push({ Numero_Personal: codirectorId, Id_rol: 2 });
    if (presidenteId) participantes.push({ Numero_Personal: presidenteId, Id_rol: 3 });
    if (secretarioId) participantes.push({ Numero_Personal: secretarioId, Id_rol: 4 });
    if (vocalId) participantes.push({ Numero_Personal: vocalId, Id_rol: 5 });
    if (sinodalId) participantes.push({ Numero_Personal: sinodalId, Id_rol: 6 });

    const payload: GuardarTrabajoPayload = {
      Titulo: titulo.trim(),
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

  if (isFinalizarMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
        {/* Modal Card Window - Compact & Centered for Finalizar */}
        <div className="w-full max-w-lg bg-[#e2e5ea] border border-slate-300 rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-800 relative transition-all my-auto max-h-[92vh] flex flex-col">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-300 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="mb-4 text-left">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[#00873e] shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Finalizar Trabajo Recepcional
                </h2>
                <span className="text-[10.5px] font-semibold text-[#00873e] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                  Estado: Generado → Finalizado
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Asigne el folio oficial del acta y el resultado obtenido en la defensa para concluir este trabajo recepcional.
            </p>
          </div>

          {/* Compact Summary of the Trabajo */}
          <div className="bg-white/70 rounded-xl p-3 border border-slate-300/80 mb-4 text-xs space-y-1.5 text-left">
            <div className="font-bold text-slate-900 line-clamp-2">
              &ldquo;{trabajoToEdit?.Titulo || titulo}&rdquo;
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
              <div>
                <span className="font-semibold text-slate-700">Modalidad:</span> {modalidad}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Defensa:</span>{' '}
                {fechaHora ? fechaHora.replace('T', ' ') : 'N/A'}
              </div>
            </div>
            {trabajoToEdit?.estudiantes && trabajoToEdit.estudiantes.length > 0 && (
              <div className="text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Sustentante(s):</span>{' '}
                {trabajoToEdit.estudiantes.map((e: any) => e.NombreCompleto || e.Matricula).join(', ')}
              </div>
            )}
          </div>

          {/* Finalize Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left flex-1 flex flex-col justify-between">
            <div className="space-y-3.5">
              {/* Folio del Acta */}
              <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-300 ring-2 ring-emerald-500/20">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Folio del Acta Oficial:</span>
                  <span className="text-[10px] text-[#00873e] bg-white px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                    Requerido
                  </span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={folio}
                  onChange={(e) => setFolio(e.target.value)}
                  placeholder="Ej. FEI-2026/015 o ACTA-001"
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 ${
                    errors.folio
                      ? 'border-red-400 focus:ring-red-400/20'
                      : 'border-emerald-400 focus:border-[#00873e] focus:ring-[#00873e]/20'
                  }`}
                />
                {errors.folio ? (
                  <p className="text-[11px] font-medium text-red-600 mt-1">{errors.folio}</p>
                ) : (
                  <p className="text-[10.5px] text-slate-500 mt-1">
                    Número de folio asignado en el libro de actas de la facultad.
                  </p>
                )}
              </div>

              {/* Resultado Obtenido */}
              <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-300 ring-2 ring-emerald-500/20">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Resultado Obtenido:</span>
                  <span className="text-[10px] text-[#00873e] bg-white px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                    Requerido
                  </span>
                </label>
                <select
                  value={resultado}
                  onChange={(e) => setResultado(e.target.value)}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 ${
                    errors.resultado
                      ? 'border-red-400 focus:ring-red-400/20'
                      : 'border-emerald-400 focus:border-[#00873e] focus:ring-[#00873e]/20'
                  }`}
                >
                  {RESULTADOS_OPCIONES.map((res) => (
                    <option key={res} value={res}>
                      {res}
                    </option>
                  ))}
                </select>
                {errors.resultado && (
                  <p className="text-[11px] font-medium text-red-600 mt-1">{errors.resultado}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-center gap-3 border-t border-slate-300">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-[#00873e] hover:bg-[#007033] active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isLoading ? 'Finalizando...' : 'Finalizar Trabajo'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-[#8e939d] hover:bg-[#7b8089] active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      {/* Modal Card Window */}
      <div className="w-full max-w-4xl bg-[#e2e5ea] border border-slate-300 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-800 relative transition-all my-auto max-h-[92vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-300 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="mb-4 text-left shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5 flex-wrap">
            <span>
              {trabajoToEdit ? 'Editar Trabajo Recepcional' : 'Registrar Trabajo Recepcional'}
            </span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Complete la información general, horario, recinto, estudiantes y participantes del comité.
          </p>
        </div>

        {/* Form Grid */}
        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-1 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* LEFT COLUMN: Datos Generales */}
            <div className="space-y-4">
              {/* Folio del Acta */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  isFolioResultadoLocked
                    ? 'bg-transparent border-transparent'
                    : 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                }`}
              >
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Folio del Acta:</span>
                  {isFolioResultadoLocked ? (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 font-normal">
                      <Lock className="w-2.5 h-2.5" /> Bloqueado (CU-05)
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#00873e] bg-white px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                      Editable
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={folio}
                  disabled={isFolioResultadoLocked}
                  onChange={(e) => setFolio(e.target.value)}
                  placeholder="Folio oficial (ej. 2026/001)"
                  className={`w-full rounded-lg sm:rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 ${
                    isFolioResultadoLocked
                      ? 'bg-slate-200/80 border-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-white border-slate-300 focus:border-[#00873e] focus:ring-[#00873e]/15'
                  }`}
                />
              </div>

              {/* Licenciatura */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                  Licenciatura:
                </label>
                <select
                  value={carreraId}
                  disabled={isFinalizarMode}
                  onChange={(e) => setCarreraId(Number(e.target.value))}
                  className={`w-full rounded-lg sm:rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium ${
                    isFinalizarMode
                      ? 'bg-slate-200/80 border-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-white border-slate-300 focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/15'
                  }`}
                >
                  {CARRERAS_OPCIONES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora de defensa */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Fecha y Hora de defensa:</span>
                  <span className="text-[10.5px] text-slate-500 font-normal flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#003882]" /> Requerido
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={fechaHora}
                  disabled={isFinalizarMode}
                  onChange={(e) => setFechaHora(e.target.value)}
                  className={`w-full rounded-lg sm:rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium ${
                    isFinalizarMode
                      ? 'bg-slate-200/80 border-slate-300 text-slate-500 cursor-not-allowed'
                      : errors.fechaHora
                      ? 'border-red-400 focus:ring-red-400/20 bg-white'
                      : 'border-slate-300 focus:border-[#003882] focus:ring-[#003882]/15 bg-white'
                  }`}
                />
                {errors.fechaHora && (
                  <p className="text-[11px] font-medium text-red-600 mt-0.5">{errors.fechaHora}</p>
                )}
              </div>

              {/* Lugar de defensa (con validación de disponibilidad y conflicto) */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Lugar de defensa:</span>
                  <span className="text-[10.5px] text-[#00873e] font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#00873e]" /> Solo recintos disponibles
                  </span>
                </label>
                <select
                  value={lugarId}
                  disabled={isFinalizarMode}
                  onChange={(e) => setLugarId(Number(e.target.value))}
                  className={`w-full rounded-lg sm:rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium ${
                    isFinalizarMode
                      ? 'bg-slate-200/80 border-slate-300 text-slate-500 cursor-not-allowed'
                      : lugarConflictivo || errors.lugar
                      ? 'border-red-400 focus:ring-red-400/20 bg-white'
                      : 'border-slate-300 focus:border-[#003882] focus:ring-[#003882]/15 bg-white'
                  }`}
                >
                  {LUGARES_DISPONIBLES.map((lug) => (
                    <option key={lug.id} value={lug.id}>
                      {lug.nombre}
                    </option>
                  ))}
                </select>
                {lugarConflictivo && !isFinalizarMode && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-red-600 bg-red-50 p-1.5 rounded-lg border border-red-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Recinto ocupado por &ldquo;{lugarConflictivo.Titulo}&rdquo; a esta hora. Seleccione otro horario o lugar.
                    </span>
                  </div>
                )}
              </div>

              {/* Modalidad */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                  Modalidad:
                </label>
                <select
                  value={modalidad}
                  disabled={isFinalizarMode}
                  onChange={(e) => setModalidad(e.target.value)}
                  className={`w-full rounded-lg sm:rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium ${
                    isFinalizarMode
                      ? 'bg-slate-200/80 border-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-white border-slate-300 focus:border-[#003882] focus:ring-2 focus:ring-[#003882]/15'
                  }`}
                >
                  {MODALIDADES_OPCIONES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Título del trabajo */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                  Título del trabajo:
                </label>
                <textarea
                  rows={3}
                  value={titulo}
                  disabled={isFinalizarMode}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ingrese el título oficial del trabajo recepcional..."
                  className={`w-full rounded-lg sm:rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium resize-none ${
                    isFinalizarMode
                      ? 'bg-slate-200/80 border-slate-300 text-slate-500 cursor-not-allowed'
                      : errors.titulo
                      ? 'border-red-400 focus:ring-red-400/20 bg-white'
                      : 'border-slate-300 focus:border-[#003882] focus:ring-[#003882]/15 bg-white'
                  }`}
                />
                {errors.titulo && (
                  <p className="text-[11px] font-medium text-red-600 mt-0.5">{errors.titulo}</p>
                )}
              </div>

              {/* Resultado Obtenido */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  isFinalizarMode
                    ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-transparent border-transparent'
                }`}
              >
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Resultado Obtenido:</span>
                  {isFinalizarMode ? (
                    <span className="text-[10.5px] text-[#00873e] bg-white px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3 text-[#00873e]" /> Requerido para Finalizar
                    </span>
                  ) : isFolioResultadoLocked ? (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 font-normal">
                      <Lock className="w-2.5 h-2.5" /> Bloqueado (CU-05)
                    </span>
                  ) : null}
                </label>
                <select
                  value={resultado}
                  disabled={isFolioResultadoLocked}
                  onChange={(e) => setResultado(e.target.value)}
                  className={`w-full rounded-lg sm:rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 ${
                    errors.resultado
                      ? 'border-red-400 focus:ring-red-400/20'
                      : isFolioResultadoLocked
                      ? 'bg-slate-200/80 border-slate-300 text-slate-500 cursor-not-allowed'
                      : isFinalizarMode
                      ? 'bg-white border-emerald-400 focus:border-[#00873e] focus:ring-[#00873e]/15'
                      : 'bg-white border-slate-300 focus:border-[#003882] focus:ring-[#003882]/15'
                  }`}
                >
                  {RESULTADOS_OPCIONES.map((res) => (
                    <option key={res} value={res}>
                      {res}
                    </option>
                  ))}
                </select>
                {errors.resultado && (
                  <p className="text-[11px] font-medium text-red-600 mt-1">{errors.resultado}</p>
                )}
                {isFolioResultadoLocked && (
                  <p className="text-[10px] text-slate-500 mt-0.5 italic">
                    {isAprobadoOGenerado
                      ? 'Folio y Resultado permanecen bloqueados en estado Aprobado y Generado.'
                      : 'Solo editable una vez que el trabajo alcance el estado Finalizado.'}
                  </p>
                )}
              </div>

              {/* Sección de Estudiantes Asignados (Múltiples sin duplicados) */}
              <div className="bg-white/60 p-3.5 rounded-xl border border-slate-300 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#003882]" />
                    <span>Estudiantes Asignados:</span>
                  </label>
                  {!isFinalizarMode && (
                    <button
                      type="button"
                      onClick={handleAddEstudiante}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#003882] hover:text-[#00275c] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar estudiante</span>
                    </button>
                  )}
                </div>

                {errors.estudiantes && (
                  <p className="text-[11px] font-medium text-red-600">{errors.estudiantes}</p>
                )}

                <div className="space-y-2">
                  {matriculasEstudiantes.map((matricula, index) => {
                    // Filtrar opciones para excluir estudiantes ya seleccionados en otros campos
                    const optionsForIndex = estudiantesOptions.filter(
                      (opt) =>
                        !matriculasEstudiantes.some(
                          (selectedMat, idx) => idx !== index && selectedMat === opt.value
                        )
                    );

                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1">
                          <SearchableSelect
                            options={optionsForIndex}
                            value={matricula || undefined}
                            disabled={isFinalizarMode}
                            onChange={(val) => handleEstudianteChange(index, val)}
                            placeholder={`-- Buscar estudiante ${index + 1} por nombre o matrícula --`}
                          />
                        </div>
                        {!isFinalizarMode && matriculasEstudiantes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEstudiante(index)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors shrink-0 cursor-pointer"
                            title="Quitar estudiante"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Participantes (Búsqueda activa) */}
            <div className="space-y-3 bg-white/40 p-4 rounded-xl border border-slate-300/60">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Participantes del Comité:
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isFinalizarMode
                    ? 'Comité académico asignado al trabajo recepcional (solo lectura)'
                    : 'Búsqueda activa de académicos registrados en el sistema FEI'}
                </p>
              </div>

              {/* Director */}
              <SearchableSelect
                label="Director:"
                options={academicosOptions}
                value={directorId}
                disabled={isFinalizarMode}
                onChange={setDirectorId}
                placeholder="-- Seleccionar Director --"
              />

              {/* Codirector */}
              <SearchableSelect
                label="Codirector:"
                options={academicosOptions}
                value={codirectorId}
                disabled={isFinalizarMode}
                onChange={setCodirectorId}
                placeholder="-- Seleccionar Codirector --"
              />

              {/* Presidente */}
              <SearchableSelect
                label="Presidente:"
                options={academicosOptions}
                value={presidenteId}
                disabled={isFinalizarMode}
                onChange={setPresidenteId}
                placeholder="-- Seleccionar Presidente --"
              />

              {/* Secretario */}
              <SearchableSelect
                label="Secretario:"
                options={academicosOptions}
                value={secretarioId}
                disabled={isFinalizarMode}
                onChange={setSecretarioId}
                placeholder="-- Seleccionar Secretario --"
              />

              {/* Vocal */}
              <SearchableSelect
                label="Vocal:"
                options={academicosOptions}
                value={vocalId}
                disabled={isFinalizarMode}
                onChange={setVocalId}
                placeholder="-- Seleccionar Vocal --"
              />

              {/* Sinodal */}
              <SearchableSelect
                label="Sinodal:"
                options={academicosOptions}
                value={sinodalId}
                disabled={isFinalizarMode}
                onChange={setSinodalId}
                placeholder="-- Seleccionar Sinodal --"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-center gap-4 border-t border-slate-300">
            <button
              type="submit"
              disabled={isLoading || (!isFinalizarMode && !!lugarConflictivo)}
              className="px-8 py-3 rounded-xl bg-[#00873e] hover:bg-[#007033] active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isFinalizarMode ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{isLoading ? 'Finalizando...' : 'Finalizar Trabajo Recepcional'}</span>
                </>
              ) : isLoading ? (
                'Guardando...'
              ) : trabajoToEdit ? (
                'Actualizar Trabajo Recepcional'
              ) : (
                'Guardar Trabajo Recepcional'
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 rounded-xl bg-[#8e939d] hover:bg-[#7b8089] active:scale-[0.98] text-white font-semibold text-sm sm:text-base shadow-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
