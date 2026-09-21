import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, CheckCircle2 } from 'lucide-react';
import type { TrabajoRecepcional } from '@/domain/models/trabajo.types';

const RESULTADOS_OPCIONES = [
  'APROBADA POR UNANIMIDAD',
  'APROBADA POR UNANIMIDAD CON MENCIÓN DE HONOR',
  'APROBADA POR MAYORÍA',
  'NO APROBADA',
];

interface FinalizarTrabajoModalProps {
  isOpen: boolean;
  onClose: () => void;
  trabajo: TrabajoRecepcional | null;
  onFinalizar: (folio: string, resultado: string) => Promise<void>;
  isLoading?: boolean;
}

export const FinalizarTrabajoModal: React.FC<FinalizarTrabajoModalProps> = ({
  isOpen,
  onClose,
  trabajo,
  onFinalizar,
  isLoading = false,
}) => {
  const [folio, setFolio] = useState('');
  const [resultado, setResultado] = useState('APROBADA POR UNANIMIDAD');
  const [errorFolio, setErrorFolio] = useState('');
  const [errorResultado, setErrorResultado] = useState('');

  useEffect(() => {
    if (isOpen && trabajo) {
      setFolio(trabajo.Folio && trabajo.Folio !== 'Pendiente' ? trabajo.Folio : '');
      setResultado(
        trabajo.Resultado && trabajo.Resultado !== 'Pendiente'
          ? trabajo.Resultado
          : 'APROBADA POR UNANIMIDAD'
      );
      setErrorFolio('');
      setErrorResultado('');
    }
  }, [isOpen, trabajo]);

  if (!isOpen || !trabajo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!folio.trim() || folio.trim().toLowerCase() === 'pendiente') {
      setErrorFolio('Debe registrar un folio oficial de acta válido para finalizar');
      hasError = true;
    } else {
      setErrorFolio('');
    }

    if (!resultado || resultado.trim() === 'Pendiente') {
      setErrorResultado('Debe seleccionar el resultado oficial obtenido en la defensa');
      hasError = true;
    } else {
      setErrorResultado('');
    }

    if (hasError) {
      toast.error('Complete el folio del acta y el resultado obtenido para finalizar');
      return;
    }

    try {
      await onFinalizar(folio.trim(), resultado.trim());
      onClose();
    } catch (err: any) {
      toast.error('Error al finalizar el trabajo recepcional', {
        description: err.message || 'Intente nuevamente.',
      });
    }
  };

  const estudiantesList = trabajo.estudiantes || trabajo.EstudianteTrabajos || [];
  const sustentantes = estudiantesList
    .map((e: any) => e.NombreCompleto || e.Estudiante?.NombreCompleto || e.Matricula)
    .filter(Boolean)
    .join(', ');

  const fechaDefensa = trabajo.Fecha_defensa
    ? trabajo.Fecha_defensa.replace('T', ' ').substring(0, 16)
    : 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      {/* Modal Card Window - Compact & Centered */}
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
            &ldquo;{trabajo.Titulo}&rdquo;
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
            <div>
              <span className="font-semibold text-slate-700">Modalidad:</span> {trabajo.Modalidad || 'N/A'}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Defensa:</span> {fechaDefensa}
            </div>
          </div>
          {sustentantes && (
            <div className="text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Sustentante(s):</span> {sustentantes}
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
                  errorFolio
                    ? 'border-red-400 focus:ring-red-400/20'
                    : 'border-emerald-400 focus:border-[#00873e] focus:ring-[#00873e]/20'
                }`}
              />
              {errorFolio ? (
                <p className="text-[11px] font-medium text-red-600 mt-1">{errorFolio}</p>
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
                  errorResultado
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
              {errorResultado && (
                <p className="text-[11px] font-medium text-red-600 mt-1">{errorResultado}</p>
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
};
