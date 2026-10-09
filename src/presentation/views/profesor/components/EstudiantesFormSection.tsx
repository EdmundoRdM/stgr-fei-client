import React from 'react';
import { Plus, Trash2, GraduationCap, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { SearchableSelect, type SelectOption } from '@/presentation/components/SearchableSelect';

interface EstudiantesFormSectionProps {
  matriculasEstudiantes: string[];
  estudiantesOptions: SelectOption[];
  onAddEstudiante: () => void;
  onRemoveEstudiante: (index: number) => void;
  onEstudianteChange: (index: number, val: string | number | undefined) => void;
  error?: string;
  sinGruposPeriodoActual?: boolean;
  infoGrupos?: string;
  isLoadingGrupos?: boolean;
}

export const EstudiantesFormSection: React.FC<EstudiantesFormSectionProps> = ({
  matriculasEstudiantes,
  estudiantesOptions,
  onAddEstudiante,
  onRemoveEstudiante,
  onEstudianteChange,
  error,
  sinGruposPeriodoActual = false,
  infoGrupos,
  isLoadingGrupos = false,
}) => {
  return (
    <div className="bg-white/60 p-3.5 rounded-xl border border-slate-300 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <GraduationCap className="w-4 h-4 text-[#003882]" />
          <span>Estudiantes Asignados:</span>
        </label>
        <button
          type="button"
          onClick={onAddEstudiante}
          disabled={sinGruposPeriodoActual || isLoadingGrupos}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#003882] hover:text-[#00275c] bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agregar estudiante</span>
        </button>
      </div>

      {/* Alerta de carga de grupos */}
      {isLoadingGrupos && (
        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 text-[#003882] animate-spin shrink-0" />
          <span>Consultando tus grupos de Experiencia Recepcional en el periodo vigente...</span>
        </div>
      )}

      {/* Alerta de precondición: Sin grupos de ER en periodo vigente */}
      {sinGruposPeriodoActual && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2 shadow-xs animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Sin grupos de ER en el periodo actual</span>
            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
              No cuentas con ningún grupo de Experiencia Recepcional asignado en el periodo escolar activo. De acuerdo con el reglamento, debes ser titular de un grupo en el periodo vigente para registrar trabajos.
            </p>
          </div>
        </div>
      )}

      {/* Información de los grupos y periodo */}
      {!sinGruposPeriodoActual && infoGrupos && (
        <div className="px-3 py-1.5 bg-blue-50/80 border border-blue-200 rounded-lg text-[#003882] text-[11px] flex items-center gap-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-[#003882] shrink-0" />
          <span>{infoGrupos}</span>
        </div>
      )}

      {error && <p className="text-[11px] font-medium text-red-600">{error}</p>}

      <div className="space-y-2">
        {matriculasEstudiantes.map((matricula, index) => {
          const optionsForIndex = estudiantesOptions.filter(
            (opt) =>
              !matriculasEstudiantes.some(
                (selectedMat, idx) => idx !== index && selectedMat === opt.value
              )
          );

          return (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <SearchableSelect
                  options={optionsForIndex}
                  value={matricula || undefined}
                  onChange={(val) => onEstudianteChange(index, val)}
                  disabled={sinGruposPeriodoActual || isLoadingGrupos}
                  placeholder={
                    sinGruposPeriodoActual
                      ? '-- Sin grupos de ER en el periodo actual --'
                      : `-- Buscar estudiante ${index + 1} por nombre o matrícula --`
                  }
                />
              </div>
              {matriculasEstudiantes.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveEstudiante(index)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors shrink-0 cursor-pointer"
                  title="Quitar estudiante"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
