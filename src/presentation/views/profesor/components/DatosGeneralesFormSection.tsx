import React from 'react';
import { Calendar, MapPin, AlertCircle, Lock, BookOpen, Clock, AlertTriangle } from 'lucide-react';
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
  fecha?: string;
  setFecha?: (val: string) => void;
  horaInicio?: string;
  setHoraInicio?: (val: string) => void;
  horaFin?: string;
  setHoraFin?: (val: string) => void;
  fechaHora?: string;
  setFechaHora?: (val: string) => void;
  lugarId: number;
  setLugarId: (val: number) => void;
  lugarConflictivo?: any;
  conflictoLugar?: any;
  conflictoCarrera?: any;
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
  fecha,
  setFecha,
  horaInicio = '10:00',
  setHoraInicio,
  horaFin = '12:00',
  setHoraFin,
  fechaHora,
  setFechaHora,
  lugarId,
  setLugarId,
  lugarConflictivo,
  conflictoLugar,
  conflictoCarrera,
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
        {conflictoCarrera ? (
          <div className="mt-1 flex items-start gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>Conflicto de carrera simultánea:</strong> Ya existe una defensa de {conflictoCarrera.carreraNombre} el mismo día de {conflictoCarrera.horaInicio} a {conflictoCarrera.horaFin} (&ldquo;{conflictoCarrera.Titulo}&rdquo;). Por regla institucional no puede haber más de una defensa de la misma carrera a la misma hora.
            </span>
          </div>
        ) : errors.carreraId ? (
          <p className="text-[11px] font-medium text-red-600 mt-0.5">{errors.carreraId}</p>
        ) : null}
        {isJefeCarrera && (
          <p className="text-[10px] text-slate-500 mt-1 italic">
            El trabajo quedará adscrito automáticamente a la licenciatura que diriges.
          </p>
        )}
      </div>

      {/* Fecha y Horarios de defensa */}
      <div className="space-y-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#003882]" />
            <span>Fecha y Horario de la defensa:</span>
          </label>
          <span className="text-[10.5px] text-slate-500 font-normal">Requerido</span>
        </div>

        {/* Selector de Fecha */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Día del evento:</label>
          <input
            type="date"
            value={fecha || (fechaHora ? fechaHora.split('T')[0] : '')}
            onChange={(e) => {
              const val = e.target.value;
              setFecha?.(val);
              if (setFechaHora) {
                setFechaHora(val && horaInicio ? `${val}T${horaInicio}` : val);
              }
            }}
            className={`w-full rounded-lg border bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 ${
              errors.fecha
                ? 'border-red-400 focus:ring-red-400/20'
                : 'border-slate-300 focus:border-[#003882] focus:ring-[#003882]/15'
            }`}
          />
          {errors.fecha && (
            <p className="text-[11px] font-medium text-red-600 mt-0.5">{errors.fecha}</p>
          )}
        </div>

        {/* Selectores de Horas: Inicio y Fin */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#003882]" /> Hora de inicio:
            </label>
            <input
              type="time"
              value={horaInicio || (fechaHora ? (fechaHora.split('T')[1] || '').substring(0, 5) : '10:00')}
              onChange={(e) => {
                const val = e.target.value;
                setHoraInicio?.(val);
                if (setFechaHora && fecha) {
                  setFechaHora(`${fecha}T${val}`);
                }
              }}
              className={`w-full rounded-lg border bg-white px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 ${
                errors.horaInicio
                  ? 'border-red-400 focus:ring-red-400/20'
                  : 'border-slate-300 focus:border-[#003882] focus:ring-[#003882]/15'
              }`}
            />
            {errors.horaInicio && (
              <p className="text-[10.5px] font-medium text-red-600 mt-0.5">{errors.horaInicio}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" /> Hora de fin:
            </label>
            <input
              type="time"
              value={horaFin || '12:00'}
              onChange={(e) => setHoraFin?.(e.target.value)}
              className={`w-full rounded-lg border bg-white px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 ${
                errors.horaFin
                  ? 'border-red-400 focus:ring-red-400/20'
                  : 'border-slate-300 focus:border-[#003882] focus:ring-[#003882]/15'
              }`}
            />
            {errors.horaFin && (
              <p className="text-[10.5px] font-medium text-red-600 mt-0.5">{errors.horaFin}</p>
            )}
          </div>
        </div>
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
            conflictoLugar || lugarConflictivo || errors.lugar
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
        {conflictoLugar ? (
          <div className="mt-1 flex items-start gap-1.5 text-[11px] font-medium text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              <strong>Conflicto de espacio:</strong> El recinto ya se encuentra ocupado de {conflictoLugar.horaInicio} a {conflictoLugar.horaFin} por &ldquo;{conflictoLugar.Titulo}&rdquo;. Seleccione otro horario o recinto.
            </span>
          </div>
        ) : lugarConflictivo ? (
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
