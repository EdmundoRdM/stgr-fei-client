import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, CheckCircle2, BookOpen, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import type { TrabajoRecepcional, SugerenciaFolioResponse } from '@/domain/models/trabajo.types';
import { trabajoService } from '@/services/trabajos/trabajoService';

interface GenerarActaModalProps {
  isOpen: boolean;
  onClose: () => void;
  trabajo: TrabajoRecepcional | null;
  onGenerar: (payload: {
    tomo: string;
    numeroFolio: string;
    folio: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export const GenerarActaModal: React.FC<GenerarActaModalProps> = ({
  isOpen,
  onClose,
  trabajo,
  onGenerar,
  isLoading = false,
}) => {
  const [tomo, setTomo] = useState<string>('1');
  const [numeroFolio, setNumeroFolio] = useState<string>('1');
  const [folio, setFolio] = useState('');
  const [sugerencia, setSugerencia] = useState<SugerenciaFolioResponse | null>(null);
  const [loadingSugerencia, setLoadingSugerencia] = useState(false);

  const [errorTomo, setErrorTomo] = useState('');
  const [errorNumeroFolio, setErrorNumeroFolio] = useState('');

  const formatFolio = (t: string, f: string): string => {
    const cleanT = t.trim();
    const cleanF = f.trim();
    if (!cleanT && !cleanF) return '';
    if (cleanT && !cleanF) return `Tomo ${cleanT}`;
    if (!cleanT && cleanF) return `Folio ${cleanF}`;
    return `Tomo ${cleanT} - Folio ${cleanF}`;
  };

  useEffect(() => {
    if (isOpen && trabajo) {
      setErrorTomo('');
      setErrorNumeroFolio('');
      setSugerencia(null);

      const idCarrera = trabajo.Id_Carrera || trabajo.Carrera?.Id_Carrera;
      if (idCarrera) {
        setLoadingSugerencia(true);
        trabajoService
          .getSiguienteFolio(idCarrera)
          .then((sug) => {
            setSugerencia(sug);
            const initTomo = sug.Tomo !== undefined && sug.Tomo !== null ? String(sug.Tomo) : '1';
            const initNumeroFolio =
              sug.Numero_Folio !== undefined && sug.Numero_Folio !== null
                ? String(sug.Numero_Folio)
                : '1';
            setTomo(initTomo);
            setNumeroFolio(initNumeroFolio);
            setFolio(sug.FolioSugerido || formatFolio(initTomo, initNumeroFolio));
          })
          .catch((err) => {
            console.error('Error al obtener sugerencia de folio:', err);
            const fallbackTomo = trabajo.Tomo ? String(trabajo.Tomo) : '1';
            const fallbackNumeroFolio = trabajo.Numero_Folio ? String(trabajo.Numero_Folio) : '1';
            setTomo(fallbackTomo);
            setNumeroFolio(fallbackNumeroFolio);
            setFolio(
              trabajo.Folio && trabajo.Folio !== 'Pendiente'
                ? trabajo.Folio
                : formatFolio(fallbackTomo, fallbackNumeroFolio)
            );
          })
          .finally(() => {
            setLoadingSugerencia(false);
          });
      } else {
        const fallbackTomo = trabajo.Tomo ? String(trabajo.Tomo) : '1';
        const fallbackNumeroFolio = trabajo.Numero_Folio ? String(trabajo.Numero_Folio) : '1';
        setTomo(fallbackTomo);
        setNumeroFolio(fallbackNumeroFolio);
        setFolio(
          trabajo.Folio && trabajo.Folio !== 'Pendiente'
            ? trabajo.Folio
            : formatFolio(fallbackTomo, fallbackNumeroFolio)
        );
      }
    }
  }, [isOpen, trabajo]);

  if (!isOpen || !trabajo) return null;

  const handleTomoChange = (val: string) => {
    setTomo(val);
    setFolio(formatFolio(val, numeroFolio));
    if (!val.trim()) {
      setErrorTomo('El Tomo es requerido');
    } else {
      setErrorTomo('');
    }
  };

  const handleNumeroFolioChange = (val: string) => {
    setNumeroFolio(val);
    setFolio(formatFolio(tomo, val));
    if (!val.trim()) {
      setErrorNumeroFolio('El Número de Folio es requerido');
    } else {
      setErrorNumeroFolio('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!tomo.trim()) {
      setErrorTomo('El Tomo es requerido');
      hasError = true;
    } else {
      setErrorTomo('');
    }

    if (!numeroFolio.trim()) {
      setErrorNumeroFolio('El Número de Folio es requerido');
      hasError = true;
    } else {
      setErrorNumeroFolio('');
    }

    if (hasError) {
      toast.error('Verifique los campos de Tomo y Folio');
      return;
    }

    try {
      await onGenerar({
        tomo: tomo.trim(),
        numeroFolio: numeroFolio.trim(),
        folio: folio.trim() || formatFolio(tomo, numeroFolio),
      });
      onClose();
    } catch (err: any) {
      toast.error('Error al generar el acta', {
        description: err.message || 'Intente nuevamente.',
      });
    }
  };

  const estudiantesList = trabajo.estudiantes || trabajo.EstudianteTrabajos || [];
  const sustentantes = estudiantesList
    .map((e: any) => e.NombreCompleto || e.Estudiante?.NombreCompleto || e.Matricula)
    .filter(Boolean)
    .join(', ');

  const carreraNombre = trabajo.Carrera?.NombreCarrera;
  const formatDefensaInfo = () => {
    if (!trabajo.Fecha_defensa) return 'Por definir';
    const datePart = trabajo.Fecha_defensa.split('T')[0];
    const timeIni = trabajo.Fecha_defensa.includes('T')
      ? trabajo.Fecha_defensa.split('T')[1].substring(0, 5)
      : '';
    const timeFin = trabajo.Fecha_fin_defensa && trabajo.Fecha_fin_defensa.includes('T')
      ? trabajo.Fecha_fin_defensa.split('T')[1].substring(0, 5)
      : '';
    const horario = timeIni && timeFin ? `${timeIni} - ${timeFin} hrs` : timeIni ? `${timeIni} hrs` : '';
    return `${datePart}${horario ? `, ${horario}` : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      {/* Modal Card Window */}
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
                Acta de trabajo generada
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10.5px] font-semibold text-[#00873e] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                  Estado: Aprobado → Generado
                </span>
                {carreraNombre && (
                  <span className="text-[10.5px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300 inline-block truncate max-w-[200px]">
                    {carreraNombre}
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Asigne el libro/tomo, folio de acta oficial (1 al 100) y el resultado obtenido en la defensa.
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
              <span className="font-semibold text-slate-700">Recinto:</span> {trabajo.Lugar?.Nombre || 'Por definir'}
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-slate-700">Defensa:</span> {formatDefensaInfo()}
            </div>
          </div>
          {sustentantes && (
            <div className="text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Sustentante(s):</span> {sustentantes}
            </div>
          )}
        </div>


        {/* Generar Acta Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left flex-1 flex flex-col justify-between">
          <div className="space-y-3.5">
            {/* Aviso o sugerencia automática */}
            {loadingSugerencia ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Consultando el siguiente folio disponible para esta carrera...</span>
              </div>
            ) : sugerencia ? (
              <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-300 text-slate-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#00873e]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sugerencia del Sistema (Libro de Actas)</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>
                    Tomo {sugerencia.Tomo}: {sugerencia.foliosOcupadosEnTomo} de 100 folios ocupados
                  </span>
                  <span className="font-semibold text-emerald-800">
                    {sugerencia.foliosDisponiblesEnTomo} disponibles
                  </span>
                </div>
                {sugerencia.mensaje && (
                  <p className="text-[11px] text-amber-700 font-medium pt-1 border-t border-emerald-200 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {sugerencia.mensaje}
                  </p>
                )}
              </div>
            ) : null}

            {/* Asignación de Tomo y Número de Folio */}
            <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-300 ring-2 ring-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800">
                  <BookOpen className="w-4 h-4 text-[#00873e]" />
                  <span>Libro y Folio de Acta:</span>
                </div>
                <span className="text-[10px] text-[#00873e] bg-white px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                  Requerido
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Tomo */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tomo (Libro):
                  </label>
                  <input
                    type="text"
                    value={tomo}
                    onChange={(e) => handleTomoChange(e.target.value)}
                    placeholder="Ej. 1"
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 ${
                      errorTomo
                        ? 'border-red-400 focus:ring-red-400/20'
                        : 'border-emerald-400 focus:border-[#00873e] focus:ring-[#00873e]/20'
                    }`}
                  />
                  {errorTomo && <p className="text-[10.5px] font-medium text-red-600 mt-1">{errorTomo}</p>}
                </div>

                {/* Numero de Folio */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Número de Folio (1-100):
                  </label>
                  <input
                    type="text"
                    value={numeroFolio}
                    onChange={(e) => handleNumeroFolioChange(e.target.value)}
                    placeholder="Ej. 4"
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 ${
                      errorNumeroFolio
                        ? 'border-red-400 focus:ring-red-400/20'
                        : 'border-emerald-400 focus:border-[#00873e] focus:ring-[#00873e]/20'
                    }`}
                  />
                  {errorNumeroFolio && (
                    <p className="text-[10.5px] font-medium text-red-600 mt-1">{errorNumeroFolio}</p>
                  )}
                </div>
              </div>

              {/* Folio Formateado */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Folio Oficial Formateado:
                </label>
                <input
                  type="text"
                  readOnly
                  value={folio}
                  placeholder="Ej. Tomo 1 - Folio 4"
                  className="w-full rounded-lg border border-slate-300 bg-slate-100/90 px-3 py-1.5 text-xs font-semibold text-slate-700 cursor-not-allowed select-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Texto descriptivo que se imprimirá en constancias y actas oficiales.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-center gap-3 border-t border-slate-300">
            <button
              type="submit"
              disabled={isLoading || loadingSugerencia}
              className="px-6 py-2.5 rounded-xl bg-[#00873e] hover:bg-[#007033] active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isLoading ? 'Generando Acta...' : 'Generar Acta'}</span>
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
