import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { SearchableSelect, type SelectOption } from '@/presentation/components/SearchableSelect';

interface ComiteAcademicoFormSectionProps {
  academicosOptions: SelectOption[];
  directorId?: string | number;
  setDirectorId: (val: string | number | undefined) => void;
  codirectorId?: string | number;
  setCodirectorId: (val: string | number | undefined) => void;
  presidenteId?: string | number;
  setPresidenteId: (val: string | number | undefined) => void;
  secretarioId?: string | number;
  setSecretarioId: (val: string | number | undefined) => void;
  vocalId?: string | number;
  setVocalId: (val: string | number | undefined) => void;
  sinodalId?: string | number;
  setSinodalId: (val: string | number | undefined) => void;
  errors?: { [key: string]: string };
}

export const ComiteAcademicoFormSection: React.FC<ComiteAcademicoFormSectionProps> = ({
  academicosOptions,
  directorId,
  setDirectorId,
  codirectorId,
  setCodirectorId,
  presidenteId,
  setPresidenteId,
  secretarioId,
  setSecretarioId,
  vocalId,
  setVocalId,
  sinodalId,
  setSinodalId,
  errors = {},
}) => {
  // Helper para filtrar opciones excluyendo profesores ya asignados a otros roles
  const getOptionsExcluding = (excludedIds: (string | number | undefined)[]) => {
    const validExcluded = new Set(
      excludedIds
        .filter((id): id is string | number => id !== undefined && id !== '')
        .map(String)
    );
    return academicosOptions.filter((opt) => !validExcluded.has(String(opt.value)));
  };

  // Director: no excluye Presidente (el Director puede fungir también como Presidente)
  const directorOptions = useMemo(
    () => getOptionsExcluding([codirectorId, secretarioId, vocalId, sinodalId]),
    [academicosOptions, codirectorId, secretarioId, vocalId, sinodalId]
  );

  // Codirector: opcional
  const codirectorOptions = useMemo(
    () => getOptionsExcluding([directorId, presidenteId, secretarioId, vocalId, sinodalId]),
    [academicosOptions, directorId, presidenteId, secretarioId, vocalId, sinodalId]
  );

  // Presidente: opcional; puede ser el mismo Director o un profesor distinto
  const presidenteOptions = useMemo(
    () => getOptionsExcluding([codirectorId, secretarioId, vocalId, sinodalId]),
    [academicosOptions, codirectorId, secretarioId, vocalId, sinodalId]
  );

  // Secretario: obligatorio; excluye a los demás
  const secretarioOptions = useMemo(
    () => getOptionsExcluding([directorId, codirectorId, presidenteId, vocalId, sinodalId]),
    [academicosOptions, directorId, codirectorId, presidenteId, vocalId, sinodalId]
  );

  // Vocal: obligatorio; excluye a los demás
  const vocalOptions = useMemo(
    () => getOptionsExcluding([directorId, codirectorId, presidenteId, secretarioId, sinodalId]),
    [academicosOptions, directorId, codirectorId, presidenteId, secretarioId, sinodalId]
  );

  // Sinodal / Lector: opcional; excluye a los demás
  const sinodalOptions = useMemo(
    () => getOptionsExcluding([directorId, codirectorId, presidenteId, secretarioId, vocalId]),
    [academicosOptions, directorId, codirectorId, presidenteId, secretarioId, vocalId]
  );

  const directorEsPresidente = Boolean(
    directorId && presidenteId && String(directorId) === String(presidenteId)
  );

  return (
    <div className="space-y-3 bg-white/40 p-4 rounded-xl border border-slate-300/60">
      <div className="border-b border-slate-200 pb-2 flex flex-col gap-1">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Participantes del Comité:
        </h3>
        <p className="text-[11px] text-slate-500">
          <strong>Director</strong>, <strong>Secretario</strong> y <strong>Vocal</strong> son obligatorios. El Director puede fungir también como Presidente. Codirector y Sinodal/Lector son opcionales.
        </p>
      </div>

      {errors.comite && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errors.comite}</span>
        </div>
      )}

      {/* Director (Obligatorio) */}
      <SearchableSelect
        label="Director: *"
        options={directorOptions}
        value={directorId}
        onChange={setDirectorId}
        placeholder="-- Seleccionar Director --"
        error={errors.director}
      />

      {/* Codirector (Opcional) */}
      <SearchableSelect
        label="Codirector (Opcional):"
        options={codirectorOptions}
        value={codirectorId}
        onChange={setCodirectorId}
        placeholder="-- Seleccionar Codirector (opcional) --"
        error={errors.codirector}
      />

      {/* Presidente (Opcional - puede ser el Director) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700">
            Presidente (Opcional):
          </label>
          {directorId && !directorEsPresidente && (
            <button
              type="button"
              onClick={() => setPresidenteId(directorId)}
              className="text-[10.5px] font-semibold text-[#003882] hover:underline cursor-pointer"
            >
              Asignar al Director como Presidente
            </button>
          )}
          {directorEsPresidente && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              El Director funge como Presidente
            </span>
          )}
        </div>
        <SearchableSelect
          options={presidenteOptions}
          value={presidenteId}
          onChange={setPresidenteId}
          placeholder="-- Seleccionar Presidente (o asignar Director) --"
          error={errors.presidente}
        />
      </div>

      {/* Secretario (Obligatorio) */}
      <SearchableSelect
        label="Secretario: *"
        options={secretarioOptions}
        value={secretarioId}
        onChange={setSecretarioId}
        placeholder="-- Seleccionar Secretario --"
        error={errors.secretario}
      />

      {/* Vocal (Obligatorio) */}
      <SearchableSelect
        label="Vocal: *"
        options={vocalOptions}
        value={vocalId}
        onChange={setVocalId}
        placeholder="-- Seleccionar Vocal --"
        error={errors.vocal}
      />

      {/* Sinodal / Lector (Opcional) */}
      <SearchableSelect
        label="Sinodal / Lector (Opcional):"
        options={sinodalOptions}
        value={sinodalId}
        onChange={setSinodalId}
        placeholder="-- Seleccionar Sinodal o Lector (opcional) --"
        error={errors.sinodal}
      />
    </div>
  );
};
