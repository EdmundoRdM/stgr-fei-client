import React, { useEffect, useState } from 'react';
import { X, MessageSquareWarning, Calendar, FileText, User, Loader2 } from 'lucide-react';
import type { TrabajoRecepcional, NotificacionRechazo } from '@/domain/models/trabajo.types';
import { trabajoService } from '@/services/trabajos/trabajoService';

interface VerMotivoRechazoModalProps {
  isOpen: boolean;
  onClose: () => void;
  trabajo: TrabajoRecepcional | null;
}

export const VerMotivoRechazoModal: React.FC<VerMotivoRechazoModalProps> = ({
  isOpen,
  onClose,
  trabajo,
}) => {
  const [notificacion, setNotificacion] = useState<NotificacionRechazo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && trabajo) {
      if (trabajo.mensajeRechazo) {
        setNotificacion(trabajo.mensajeRechazo);
      } else {
        setIsLoading(true);
        trabajoService
          .obtenerMensajeRechazo(trabajo.Id_TrabajoR)
          .then((res) => {
            setNotificacion(res.mensajeRechazo);
          })
          .catch((err) => {
            console.error('Error al obtener mensaje de rechazo:', err);
            setNotificacion(null);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    } else {
      setNotificacion(null);
      setIsLoading(false);
    }
  }, [isOpen, trabajo]);

  if (!isOpen || !trabajo) return null;

  const formatearFecha = (fechaStr?: string) => {
    if (!fechaStr) return 'Fecha no especificada';
    try {
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) return fechaStr;
      return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(fecha);
    } catch {
      return fechaStr;
    }
  };

  const obtenerNombreEstudiante = (item: any): string => {
    const est = item?.Estudiante || item;
    if (est?.NombreCompleto) return est.NombreCompleto;
    const compuesto = `${est?.Nombre || ''} ${est?.ApellidoP || ''} ${est?.ApellidoM || ''}`.trim();
    if (compuesto) return compuesto;
    return est?.Matricula || 'Estudiante';
  };

  const estudiantes = trabajo.estudiantes || trabajo.EstudianteTrabajos || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 transition-all">
        {/* Cabecera del Modal (Gris claro elegante) */}
        <div className="bg-slate-100 border-b border-slate-200/90 text-slate-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-200 rounded-lg text-slate-700">
              <MessageSquareWarning className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-800 leading-tight">
                Motivo de Rechazo
              </h3>
              <p className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
                Observaciones registradas por la Secretaría de la Facultad
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Datos del trabajo */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-600 block text-[10.5px] uppercase tracking-wider">
                  Trabajo Recepcional:
                </span>
                <p className="font-bold text-slate-900 leading-snug">
                  {trabajo.Titulo}
                </p>
              </div>
            </div>

            {estudiantes.length > 0 && (
              <div className="flex items-start gap-2 pt-1.5 border-t border-slate-200/70">
                <User className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="text-[11.5px] text-slate-700">
                  <span className="font-semibold">Estudiante(s): </span>
                  {estudiantes.map((e: any, idx: number) => {
                    const nombre = obtenerNombreEstudiante(e);
                    return (
                      <span key={e.Id_EstudianteTrabajo || idx} className="inline-block mr-2 font-medium">
                        {nombre}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Caja con el Mensaje */}
          {isLoading ? (
            <div className="py-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-[#b03a2e] animate-spin" />
              <span className="text-xs font-medium">Consultando observaciones del rechazo...</span>
            </div>
          ) : notificacion ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="font-bold text-slate-700 uppercase tracking-wider">
                  Observaciones para corrección:
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatearFecha(notificacion.Fecha)}
                </span>
              </div>

              <div className="bg-red-50/70 border border-red-200 rounded-lg p-3.5 text-slate-800 text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap font-medium">
                {notificacion.Mensaje}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center text-slate-500 text-xs">
              No se encontraron observaciones detalladas registradas para este trabajo recepcional.
            </div>
          )}

          {/* Botón de cierre */}
          <div className="pt-2 flex items-center justify-end border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-5 rounded-lg bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
