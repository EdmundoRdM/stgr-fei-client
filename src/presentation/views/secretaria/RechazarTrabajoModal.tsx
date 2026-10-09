import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, FileText, User } from 'lucide-react';
import type { TrabajoRecepcional } from '@/domain/models/trabajo.types';

interface RechazarTrabajoModalProps {
  isOpen: boolean;
  onClose: () => void;
  trabajo: TrabajoRecepcional | null;
  onSolicitarConfirmacion: (motivo: string) => void;
  isLoading?: boolean;
}

export const RechazarTrabajoModal: React.FC<RechazarTrabajoModalProps> = ({
  isOpen,
  onClose,
  trabajo,
  onSolicitarConfirmacion,
  isLoading = false,
}) => {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  // Limpiar formulario al abrir o cambiar de trabajo
  useEffect(() => {
    if (isOpen) {
      setMotivo('');
      setError('');
    }
  }, [isOpen, trabajo]);

  if (!isOpen || !trabajo) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const motivoLimpio = motivo.trim();

    if (!motivoLimpio) {
      setError('Debe especificar el motivo o las observaciones del rechazo para el docente.');
      return;
    }

    if (motivoLimpio.length < 5) {
      setError('El motivo debe contener al menos 5 caracteres descriptivos.');
      return;
    }

    setError('');
    // Invoca la confirmación mediante alerta antes de proceder
    onSolicitarConfirmacion(motivoLimpio);
  };

  const handleCancelar = () => {
    setError('');
    setMotivo('');
    onClose();
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
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-800 leading-tight">
                Rechazar Trabajo Recepcional
              </h3>
              <p className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
                Devolución a estado Borrador para correcciones
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelar}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Información contextual del trabajo */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-600 block text-[10.5px] uppercase tracking-wider">
                  Título del Trabajo:
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

          {/* Campo de Motivo */}
          <div className="space-y-1.5">
            <label
              htmlFor="motivoRechazo"
              className="block text-xs font-bold text-slate-700"
            >
              Motivo del rechazo <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500">
              Indique con claridad las correcciones u observaciones que el docente debe atender.
            </p>
            <textarea
              id="motivoRechazo"
              rows={4}
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ejemplo: El protocolo requiere actualizar las referencias bibliográficas y corregir el objetivo específico #2 conforme a las observaciones del comité..."
              className={`w-full p-2.5 text-xs text-slate-800 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all resize-y ${
                error
                  ? 'border-red-400 focus:ring-red-400/30'
                  : 'border-slate-300 focus:border-[#c0392b] focus:ring-[#c0392b]/20'
              }`}
              disabled={isLoading}
              autoFocus
            />

            {error && (
              <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 mt-1 animate-fadeIn">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCancelar}
              disabled={isLoading}
              className="py-2 px-4 rounded-lg bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="py-2 px-5 rounded-lg bg-[#c0392b] hover:bg-[#a93226] active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>Rechazar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
