import React from 'react';
import { Calendar, MapPin, AlertCircle, Lock } from 'lucide-react';
import {
  CARRERAS_OPCIONES,
  MODALIDADES_OPCIONES,
  RESULTADOS_OPCIONES,
  LUGARES_DISPONIBLES,
} from '../constants/trabajoCatalogos';

interface DatosGeneralesFormSectionProps {
  folio: string;
  setFolio: (val: string) => void;
  isFolioResultadoLocked: boolean;
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
  isFolioResultadoLocked,
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
            <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1 font-normal">
              <Lock className="w-2.5 h-2.5 text-slate-500" /> Asignado al finalizar acta
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
          onChange={(e) => setCarreraId(Number(e.target.value))}
          className={`w-full rounded-lg sm:rounded-xl border bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 ${
            errors.carreraId
              ? 'border-red-400 focus:ring-red-400/20'
              : 'border-slate-300 focus:border-[#003882] focus:ring-[#003882]/15'
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
