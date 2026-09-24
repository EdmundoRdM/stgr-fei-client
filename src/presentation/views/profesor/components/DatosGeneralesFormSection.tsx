import React from 'react';
import { Calendar, MapPin, AlertCircle, Lock, BookOpen } from 'lucide-react';
import {
  CARRERAS_OPCIONES,
  MODALIDADES_OPCIONES,
  RESULTADOS_OPCIONES,
  LUGARES_DISPONIBLES,
} from '../constants/trabajoCatalogos';

interface DatosGeneralesFormSectionProps {
  folio: string;
  setFolio: (val: string) => void;
  tomo?: number;
  setTomo?: (val: number | undefined) => void;
  numeroFolio?: number;
  setNumeroFolio?: (val: number | undefined) => void;
  handleTomoChange?: (val: number | undefined) => void;
  handleNumeroFolioChange?: (val: number | undefined) => void;
  isFolioResultadoLocked: boolean;
  isJefeCarrera?: boolean;
  carreraId: number;
  setCarreraId: (val: number) => void;
  fechaHora: string;
  setFechaHora: (val: string) => void;
  lugarId: number;
  setLugarId: (val: number) => void;
  lugarConflictivo: any;
  modalidad: string;
  setModalidad: (val: string) => void;
  titulo: string;
  setTitulo: (val: string) => void;
  resultado: string;
  setResultado: (val: string) => void;
  errors: { [key: string]: string };
}

export const DatosGeneralesFormSection: React.FC<DatosGeneralesFormSectionProps> = ({
  folio,
  setFolio,
  tomo,
  numeroFolio,
  handleTomoChange,
  handleNumeroFolioChange,
  isFolioResultadoLocked,
  isJefeCarrera = false,
  carreraId,
  setCarreraId,
  fechaHora,
  setFechaHora,
  lugarId,
  setLugarId,
  lugarConflictivo,
  modalidad,
  setModalidad,
  titulo,
  setTitulo,
  resultado,
  setResultado,
  errors,
}) => {
  return (
    <div className="space-y-4">
      {/* Libro (Tomo) y Folio del Acta Oficial */}
      <div
        className={`p-3.5 rounded-xl border transition-all ${
          isFolioResultadoLocked
            ? 'bg-slate-100/70 border-slate-300'
            : 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#00873e]" />
            <span>Libro (Tomo) y Folio de Acta:</span>
          </label>
          {isFolioResultadoLocked ? (
            <span className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-300 flex items-center gap-1 font-medium">
              <Lock className="w-2.5 h-2.5 text-slate-500" /> Asignado al finalizar acta
            </span>
          ) : (
            <span className="text-[10px] text-[#00873e] bg-white px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
              Editable en Finalizado
            </span>
          )}
        </div>

        {isFolioResultadoLocked ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-200/80 rounded-lg p-2 border border-slate-300">
              <span className="text-[10px] text-slate-500 font-semibold block">Tomo:</span>
              <span className="font-bold text-slate-700">
                {tomo ? `Tomo ${tomo}` : 'Pendiente'}
              </span>
            </div>
            <div className="bg-slate-200/80 rounded-lg p-2 border border-slate-300">
              <span className="text-[10px] text-slate-500 font-semibold block">Folio:</span>
              <span className="font-bold text-slate-700">
                {numeroFolio ? `Folio ${numeroFolio}` : folio && folio !== 'Pendiente' ? folio : 'Pendiente'}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                  Tomo (Libro):
                </label>
                <input
                  type="number"
                  min={1}
                  value={tomo ?? ''}
                  onChange={(e) =>
                    handleTomoChange
                      ? handleTomoChange(e.target.value ? parseInt(e.target.value, 10) : undefined)
                      : undefined
                  }
                  placeholder="Ej. 1"
                  className={`w-full rounded-lg border bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 ${
                    errors.tomo
                      ? 'border-red-400 focus:ring-red-400/20'
                      : 'border-emerald-400 focus:border-[#00873e] focus:ring-[#00873e]/20'
                  }`}
                />
                {errors.tomo && (
                  <p className="text-[10px] font-medium text-red-600 mt-0.5">{errors.tomo}</p>
                )}
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                  Número de Folio (1-100):
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={numeroFolio ?? ''}
                  onChange={(e) =>
                    handleNumeroFolioChange
                      ? handleNumeroFolioChange(e.target.value ? parseInt(e.target.value, 10) : undefined)
                      : undefined
                  }
                  placeholder="Ej. 15"
                  className={`w-full rounded-lg border bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 ${
                    errors.numeroFolio
                      ? 'border-red-400 focus:ring-red-400/20'
                      : 'border-emerald-400 focus:border-[#00873e] focus:ring-[#00873e]/20'
                  }`}
                />
                {errors.numeroFolio && (
                  <p className="text-[10px] font-medium text-red-600 mt-0.5">{errors.numeroFolio}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-slate-600 mb-0.5">
                Folio Oficial Formateado:
              </label>
              <input
                type="text"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                placeholder="Ej. Tomo 2 - Folio 98"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#00873e]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Licenciatura */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1 flex items-center justify-between">
          <span>Licenciatura:</span>
          {isJefeCarrera && (
            <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1 font-normal">
              <Lock className="w-2.5 h-2.5 text-slate-500" /> Asignada a tu jefatura
            </span>
          )}
        </label>
        <select
          value={carreraId}
          disabled={isJefeCarrera}
          onChange={(e) => setCarreraId(Number(e.target.value))}
          className={`w-full rounded-lg sm:rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 ${
            isJefeCarrera
              ? 'bg-slate-200/80 border-slate-300 text-slate-600 cursor-not-allowed'
              : errors.carreraId
              ? 'border-red-400 bg-white focus:ring-red-400/20'
              : 'bg-white border-slate-300 focus:border-[#003882] focus:ring-[#003882]/15'
          }`}
        >
          {CARRERAS_OPCIONES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        {errors.carreraId && (
          <p className="text-[11px] font-medium text-red-600 mt-0.5">{errors.carreraId}</p>
        )}
        {isJefeCarrera && (
          <p className="text-[10px] text-slate-500 mt-1 italic">
            El trabajo quedará adscrito automáticamente a la licenciatura que diriges.
          </p>
        )}
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
          onChange={(e) => setFechaHora(e.target.value)}
          className={`w-full rounded-lg sm:rounded-xl border bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 ${
            errors.fechaHora
              ? 'border-red-400 focus:ring-red-400/20'
              : 'border-slate-300 focus:border-[#003882] focus:ring-[#003882]/15'
          }`}
        />
        {errors.fechaHora && (
          <p className="text-[11px] font-medium text-red-600 mt-0.5">{errors.fechaHora}</p>
        )}
      </div>

      {/* Lugar de defensa */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1 flex items-center justify-between">
          <span>Lugar de defensa:</span>
          <span className="text-[10.5px] text-[#00873e] font-semibold flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#00873e]" /> Solo recintos disponibles
          </span>
        </label>
        <select
          value={lugarId}
          onChange={(e) => setLugarId(Number(e.target.value))}
          className={`w-full rounded-lg sm:rounded-xl border bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 ${
            lugarConflictivo || errors.lugar
              ? 'border-red-400 focus:ring-red-400/20'
              : 'border-slate-300 focus:border-[#003882] focus:ring-[#003882]/15'
          }`}
        >
          {LUGARES_DISPONIBLES.map((lug) => (
            <option key={lug.id} value={lug.id}>
              {lug.nombre}
            </option>
          ))}
        </select>
        {lugarConflictivo ? (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-red-600 bg-red-50 p-1.5 rounded-lg border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Recinto ocupado por &ldquo;{lugarConflictivo.Titulo}&rdquo; a esta hora. Seleccione otro horario o lugar.
            </span>
          </div>
        ) : (
          errors.lugar && (
            <p className="text-[11px] font-medium text-red-600 mt-0.5">{errors.lugar}</p>
          )
        )}
      </div>

      {/* Modalidad */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
          Modalidad:
        </label>
        <select
          value={modalidad}
          onChange={(e) => setModalidad(e.target.value)}
          className={`w-full rounded-lg sm:rounded-xl border bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 ${
            errors.modalidad
              ? 'border-red-400 focus:ring-red-400/20'
              : 'border-slate-300 focus:border-[#003882] focus:ring-[#003882]/15'
          }`}
        >
          {MODALIDADES_OPCIONES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {errors.modalidad && (
          <p className="text-[11px] font-medium text-red-600 mt-0.5">{errors.modalidad}</p>
        )}
      </div>

      {/* Título del trabajo */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
          Título del trabajo:
        </label>
        <textarea
          rows={3}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ingrese el título oficial del trabajo recepcional..."
          className={`w-full rounded-lg sm:rounded-xl border bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 resize-none ${
            errors.titulo
              ? 'border-red-400 focus:ring-red-400/20'
              : 'border-slate-300 focus:border-[#003882] focus:ring-[#003882]/15'
          }`}
        />
        {errors.titulo && (
          <p className="text-[11px] font-medium text-red-600 mt-0.5">{errors.titulo}</p>
        )}
      </div>

      {/* Resultado Obtenido */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1 flex items-center justify-between">
          <span>Resultado Obtenido:</span>
          {isFolioResultadoLocked && (
            <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1 font-normal">
              <Lock className="w-2.5 h-2.5 text-slate-500" /> Asignado al finalizar acta
            </span>
          )}
        </label>
        <select
          value={resultado}
          disabled={isFolioResultadoLocked}
          onChange={(e) => setResultado(e.target.value)}
          className={`w-full rounded-lg sm:rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 ${
            isFolioResultadoLocked
              ? 'bg-slate-200/80 border-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-white border-slate-300 focus:border-[#003882] focus:ring-[#003882]/15'
          }`}
        >
          {RESULTADOS_OPCIONES.map((res) => (
            <option key={res} value={res}>
              {res}
            </option>
          ))}
        </select>
        {isFolioResultadoLocked && (
          <p className="text-[10px] text-slate-500 mt-0.5 italic">
            El folio y el resultado son asignados de forma oficial durante el registro del acta final.
          </p>
        )}
      </div>
    </div>
  );
};
