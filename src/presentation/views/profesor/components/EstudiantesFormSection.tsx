import React from 'react';
import { Plus, Trash2, GraduationCap } from 'lucide-react';
import { SearchableSelect, type SelectOption } from '@/presentation/components/SearchableSelect';

interface EstudiantesFormSectionProps {
  matriculasEstudiantes: string[];
  estudiantesOptions: SelectOption[];
  onAddEstudiante: () => void;
  onRemoveEstudiante: (index: number) => void;
  onEstudianteChange: (index: number, val: string | number | undefined) => void;
  error?: string;
}

export const EstudiantesFormSection: React.FC<EstudiantesFormSectionProps> = ({
  matriculasEstudiantes,
  estudiantesOptions,
  onAddEstudiante,
  onRemoveEstudiante,
  onEstudianteChange,
  error,
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
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#003882] hover:text-[#00275c] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agregar estudiante</span>
        </button>
      </div>

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
                  placeholder={`-- Buscar estudiante ${index + 1} por nombre o matrícula --`}
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
