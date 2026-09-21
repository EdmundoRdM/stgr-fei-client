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

  const directorOptions = useMemo(
    () => getOptionsExcluding([codirectorId, presidenteId, secretarioId, vocalId, sinodalId]),
    [academicosOptions, codirectorId, presidenteId, secretarioId, vocalId, sinodalId]
  );

  const codirectorOptions = useMemo(
    () => getOptionsExcluding([directorId, presidenteId, secretarioId, vocalId, sinodalId]),
    [academicosOptions, directorId, presidenteId, secretarioId, vocalId, sinodalId]
  );

  const presidenteOptions = useMemo(
    () => getOptionsExcluding([directorId, codirectorId, secretarioId, vocalId, sinodalId]),
    [academicosOptions, directorId, codirectorId, secretarioId, vocalId, sinodalId]
  );

  const secretarioOptions = useMemo(
    () => getOptionsExcluding([directorId, codirectorId, presidenteId, vocalId, sinodalId]),
    [academicosOptions, directorId, codirectorId, presidenteId, vocalId, sinodalId]
  );

  const vocalOptions = useMemo(
    () => getOptionsExcluding([directorId, codirectorId, presidenteId, secretarioId, sinodalId]),
    [academicosOptions, directorId, codirectorId, presidenteId, secretarioId, sinodalId]
  );

  const sinodalOptions = useMemo(
    () => getOptionsExcluding([directorId, codirectorId, presidenteId, secretarioId, vocalId]),
    [academicosOptions, directorId, codirectorId, presidenteId, secretarioId, vocalId]
  );

  return (
    <div className="space-y-3 bg-white/40 p-4 rounded-xl border border-slate-300/60">
      <div className="border-b border-slate-200 pb-2 flex flex-col gap-1">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Participantes del Comité:
        </h3>
        <p className="text-[11px] text-slate-500">
          Cada profesor solo puede desempeñar un único rol dentro del comité de este trabajo recepcional.
        </p>
      </div>

      {errors.comite && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errors.comite}</span>
        </div>
      )}

      {/* Director */}
      <SearchableSelect
        label="Director:"
        options={directorOptions}
        value={directorId}
        onChange={setDirectorId}
        placeholder="-- Seleccionar Director --"
        error={errors.director}
      />

      {/* Codirector */}
      <SearchableSelect
        label="Codirector:"
        options={codirectorOptions}
        value={codirectorId}
        onChange={setCodirectorId}
        placeholder="-- Seleccionar Codirector --"
        error={errors.codirector}
      />

      {/* Presidente */}
      <SearchableSelect
        label="Presidente:"
        options={presidenteOptions}
        value={presidenteId}
        onChange={setPresidenteId}
        placeholder="-- Seleccionar Presidente --"
        error={errors.presidente}
      />

      {/* Secretario */}
      <SearchableSelect
        label="Secretario:"
        options={secretarioOptions}
        value={secretarioId}
        onChange={setSecretarioId}
        placeholder="-- Seleccionar Secretario --"
        error={errors.secretario}
      />

      {/* Vocal */}
      <SearchableSelect
        label="Vocal:"
        options={vocalOptions}
        value={vocalId}
        onChange={setVocalId}
        placeholder="-- Seleccionar Vocal --"
        error={errors.vocal}
      />

      {/* Sinodal */}
      <SearchableSelect
        label="Sinodal:"
        options={sinodalOptions}
        value={sinodalId}
        onChange={setSinodalId}
        placeholder="-- Seleccionar Sinodal --"
        error={errors.sinodal}
      />
    </div>
  );
};
