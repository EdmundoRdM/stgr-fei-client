import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  X,
  FileCheck,
  CheckCircle2,
  Clock,
  User,
  GraduationCap,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';
import { documentoService } from '@/services/documentos/documentoService';
import type { TrabajoRecepcional } from '@/domain/models/trabajo.types';

interface RecepcionDocumentosModalProps {
  isOpen: boolean;
  onClose: () => void;
  trabajo: TrabajoRecepcional | null;
  numeroPersonal?: string | number | null;
}

export const RecepcionDocumentosModal: React.FC<RecepcionDocumentosModalProps> = ({
  isOpen,
  onClose,
  trabajo,
  numeroPersonal,
}) => {
  const queryClient = useQueryClient();
  const idTrabajo = trabajo?.Id_TrabajoR;

  // Consultar el checklist y matriz de documentos desde la API
  const {
    data: checklistData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['checklist', idTrabajo],
    queryFn: () => (idTrabajo ? documentoService.getChecklistTrabajo(idTrabajo) : null),
    enabled: isOpen && !!idTrabajo,
  });

  // Estudiante actualmente activo en pestañas (si hay más de uno)
  const [activeMatricula, setActiveMatricula] = useState<string>('');

  // Estado local para los checkboxes de cada estudiante { [matricula_idDoc]: boolean }
  const [localChecklist, setLocalChecklist] = useState<{ [key: string]: boolean }>({});
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Inicializar estado local cuando se carga la data del backend
  useEffect(() => {
    if (checklistData?.estudiantes) {
      const initialMap: { [key: string]: boolean } = {};
      checklistData.estudiantes.forEach((est) => {
        est.documentos.forEach((doc) => {
          initialMap[`${est.Matricula}_${doc.Id_Documento}`] = !!doc.Entregado;
        });
      });
      setLocalChecklist(initialMap);
      setHasChanges(false);

      if (!activeMatricula && checklistData.estudiantes.length > 0) {
        setActiveMatricula(checklistData.estudiantes[0].Matricula);
      }
    }
  }, [checklistData]);

  // Si cambia el trabajo seleccionado, reiniciar pestaña
  useEffect(() => {
    if (isOpen && checklistData?.estudiantes && checklistData.estudiantes.length > 0) {
      setActiveMatricula(checklistData.estudiantes[0].Matricula);
    }
  }, [isOpen, idTrabajo]);

  // Mutación para guardar entregas en lote
  const guardarLoteMutation = useMutation({
    mutationFn: async () => {
      if (!idTrabajo || !checklistData?.estudiantes) return;

      const entregas: Array<{ Matricula: string; Id_Documento: number; Entregado: boolean }> = [];

      checklistData.estudiantes.forEach((est) => {
        est.documentos.forEach((doc) => {
          const currentVal = localChecklist[`${est.Matricula}_${doc.Id_Documento}`] ?? !!doc.Entregado;
          entregas.push({
            Matricula: est.Matricula,
            Id_Documento: doc.Id_Documento,
            Entregado: currentVal,
          });
        });
      });

      return await documentoService.registrarLote(idTrabajo, {
        entregas,
        Numero_Personal: numeroPersonal,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', idTrabajo] });
      queryClient.invalidateQueries({ queryKey: ['trabajos'] });
      toast.success('Documentación actualizada', {
        description: 'Se han guardado las entregas de documentos exitosamente.',
      });
      setHasChanges(false);
    },
    onError: (err: any) => {
      toast.error('Error al guardar documentos', {
        description: err.response?.data?.detalle || err.message,
      });
    },
  });

  // Toggle local de un documento
  const handleToggleDoc = (matricula: string, idDoc: number) => {
    const key = `${matricula}_${idDoc}`;
    setLocalChecklist((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      return updated;
    });
    setHasChanges(true);
  };

  // Guardar cambios
  const handleGuardar = async () => {
    await guardarLoteMutation.mutateAsync();
  };

  // Calcular progreso y totales para la vista actual
  const currentEstudiante = useMemo(() => {
    if (!checklistData?.estudiantes) return null;
    return (
      checklistData.estudiantes.find((e) => e.Matricula === activeMatricula) ||
      checklistData.estudiantes[0] ||
      null
    );
  }, [checklistData, activeMatricula]);

  const stats = useMemo(() => {
    if (!checklistData?.estudiantes) return { entregados: 0, total: 0, porcentaje: 0, completo: false };

    let totalDocs = 0;
    let entregados = 0;

    checklistData.estudiantes.forEach((est) => {
      est.documentos.forEach((doc) => {
        totalDocs++;
        const isChecked = localChecklist[`${est.Matricula}_${doc.Id_Documento}`] ?? doc.Entregado;
        if (isChecked) entregados++;
      });
    });

    const porcentaje = totalDocs > 0 ? Math.round((entregados / totalDocs) * 100) : 0;
    const completo = totalDocs > 0 && entregados === totalDocs;

    return { entregados, total: totalDocs, porcentaje, completo };
  }, [checklistData, localChecklist]);

  if (!isOpen || !trabajo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      {/* Ventana Modal */}
      <div className="w-full max-w-3xl bg-[#e2e5ea] border border-slate-300 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-800 relative transition-all my-8 max-h-[90vh] flex flex-col">
        {/* Botón de cierre */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-300 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado del Modal */}
        <div className="mb-4 text-left border-b border-slate-300 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#003882]/10 text-[#003882]">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Recepción de documentos
              </h2>
              <p className="text-xs text-slate-600">
                Experiencia Recepcional &bull; Control de requisitos para Generación de Acta (CU-06)
              </p>
            </div>
          </div>

          {/* Información del trabajo recepcional */}
          <div className="mt-3 p-3 rounded-xl bg-white/70 border border-slate-300/80 text-xs space-y-1">
            <p className="font-bold text-slate-900 leading-snug line-clamp-2">
              &ldquo;{trabajo.Titulo}&rdquo;
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 text-[11.5px]">
              <span>
                <strong className="text-slate-700">Licenciatura:</strong>{' '}
                {trabajo.Carrera?.NombreCarrera || 'Ingeniería de Software'}
              </span>
              <span>
                <strong className="text-slate-700">Modalidad:</strong> {trabajo.Modalidad || 'Tesis'}
              </span>
              <span>
                <strong className="text-slate-700">Estado:</strong>{' '}
                <span className="font-bold text-[#00873e]">
                  {trabajo.EstadoListum?.EstadoNombre || 'Aprobado'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Contenido Central */}
        <div className="flex-1 overflow-y-auto pr-1 text-left space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">
              <Loader2 className="w-8 h-8 text-[#003882] animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Cargando checklist de documentos...</p>
            </div>
          ) : isError ? (
            <div className="py-8 text-center text-red-600 bg-red-50 rounded-xl p-4 border border-red-200">
              <AlertCircle className="w-6 h-6 mx-auto mb-1" />
              <p className="text-xs font-semibold">Error al cargar la documentación del trabajo.</p>
              <button
                onClick={() => refetch()}
                className="mt-2 text-xs text-[#003882] underline font-bold cursor-pointer"
              >
                Reintentar consulta
              </button>
            </div>
          ) : !checklistData?.estudiantes || checklistData.estudiantes.length === 0 ? (
            <div className="py-8 text-center text-slate-500 bg-white/50 rounded-xl p-4">
              <p className="text-xs font-semibold">No se encontraron estudiantes asignados a este trabajo.</p>
            </div>
          ) : (
            <>
              {/* Selector de Pestañas de Estudiantes (si hay más de 1) */}
              {checklistData.estudiantes.length > 1 && (
                <div className="flex items-center gap-2 border-b border-slate-300 pb-2 overflow-x-auto">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0">
                    <User className="w-3.5 h-3.5 text-[#003882]" /> Alumnos:
                  </span>
                  {checklistData.estudiantes.map((est) => {
                    const isSelected = est.Matricula === activeMatricula;
                    const estEntregados = est.documentos.filter(
                      (d) => localChecklist[`${est.Matricula}_${d.Id_Documento}`] ?? d.Entregado
                    ).length;
                    const isEstCompleto = estEntregados === est.documentos.length;

                    return (
                      <button
                        key={est.Matricula}
                        type="button"
                        onClick={() => setActiveMatricula(est.Matricula)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-[#003882] text-white border-[#003882] shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <span>{est.NombreCompleto || est.Matricula}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : isEstCompleto
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {estEntregados}/{est.documentos.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Barra de Progreso y Resumen */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-300 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#003882]" />
                    <span>Progreso de Documentación Global:</span>
                  </span>
                  <span
                    className={`font-bold text-xs ${
                      stats.completo ? 'text-[#00873e]' : 'text-slate-700'
                    }`}
                  >
                    {stats.entregados} de {stats.total} documentos entregados ({stats.porcentaje}%)
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      stats.completo ? 'bg-[#00873e]' : 'bg-[#003882]'
                    }`}
                    style={{ width: `${stats.porcentaje}%` }}
                  />
                </div>

                {stats.completo && (
                  <div className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-[#00873e] shrink-0" />
                    <span>
                      ¡Documentación completa! Todos los requisitos han sido recibidos. Ya se puede generar el acta.
                    </span>
                  </div>
                )}
              </div>

              {/* Lista de Documentos Oficiales del Estudiante Seleccionado */}
              {currentEstudiante && (
                <div className="bg-white rounded-xl border border-slate-300 overflow-hidden shadow-2xs">
                  <div className="bg-[#b8bcc4]/60 px-4 py-2 border-b border-slate-300 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Documentos de: {currentEstudiante.NombreCompleto} ({currentEstudiante.Matricula})
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium">
                      Marque los documentos que han sido recibidos
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {currentEstudiante.documentos.map((doc, index) => {
                      const isChecked =
                        localChecklist[`${currentEstudiante.Matricula}_${doc.Id_Documento}`] ??
                        !!doc.Entregado;

                      return (
                        <label
                          key={doc.Id_Documento}
                          className={`flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer select-none ${
                            isChecked ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1 pr-4">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                handleToggleDoc(currentEstudiante.Matricula, doc.Id_Documento)
                              }
                              className="mt-0.5 w-4 h-4 rounded text-[#00873e] focus:ring-[#00873e] border-slate-300 cursor-pointer"
                            />
                            <div className="space-y-0.5">
                              <span className="text-xs sm:text-[13px] font-semibold text-slate-800 leading-snug block">
                                {index + 1}. {doc.NombreDocumento}
                              </span>
                              {doc.FechaEntrega && isChecked && (
                                <span className="text-[10.5px] text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  Entregado:{' '}
                                  {new Date(doc.FechaEntrega).toLocaleDateString('es-MX', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isChecked ? (
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Entregado
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10.5px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                Pendiente
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="mt-4 pt-4 border-t border-slate-300 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 italic">
            {hasChanges ? 'Hay cambios sin guardar' : 'Todos los cambios están guardados'}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardarLoteMutation.isPending || !hasChanges}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#00873e] hover:bg-[#007033] active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardarLoteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Documentación</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={guardarLoteMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-[#8e939d] hover:bg-[#7b8089] active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
