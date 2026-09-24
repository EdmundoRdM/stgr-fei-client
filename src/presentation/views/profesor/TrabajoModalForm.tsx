import React from 'react';
import { X } from 'lucide-react';
import { useTrabajoForm } from './hooks/useTrabajoForm';
import { DatosGeneralesFormSection } from './components/DatosGeneralesFormSection';
import { EstudiantesFormSection } from './components/EstudiantesFormSection';
import { ComiteAcademicoFormSection } from './components/ComiteAcademicoFormSection';
import type { TrabajoRecepcional } from '@/domain/models/trabajo.types';
import type { GuardarTrabajoPayload } from '@/services/trabajos/trabajoService';

interface TrabajoModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: GuardarTrabajoPayload) => Promise<void>;
  trabajoToEdit?: TrabajoRecepcional | null;
  existingTrabajos?: TrabajoRecepcional[];
  isLoading?: boolean;
}

export const TrabajoModalForm: React.FC<TrabajoModalFormProps> = ({
  isOpen,
  onClose,
  onSave,
  trabajoToEdit,
  existingTrabajos = [],
  isLoading = false,
}) => {
  const form = useTrabajoForm({
    isOpen,
    onClose,
    onSave,
    trabajoToEdit,
    existingTrabajos,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      {/* Modal Card Window */}
      <div className="w-full max-w-4xl bg-[#e2e5ea] border border-slate-300 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-800 relative transition-all my-auto max-h-[92vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-300 transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="mb-4 text-left shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {trabajoToEdit ? 'Editar Trabajo Recepcional' : 'Registrar Trabajo Recepcional'}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Complete la información general, horario, recinto, estudiantes y participantes del comité.
          </p>
        </div>

        {/* Form Grid */}
        <form onSubmit={form.handleSubmit} className="space-y-6 overflow-y-auto pr-1 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* LEFT COLUMN: Datos Generales y Estudiantes */}
            <div className="space-y-4">
              <DatosGeneralesFormSection
                folio={form.folio}
                setFolio={form.setFolio}
                isFolioResultadoLocked={form.isFolioResultadoLocked}
                carreraId={form.carreraId}
                setCarreraId={form.setCarreraId}
                fechaHora={form.fechaHora}
                setFechaHora={form.setFechaHora}
                lugarId={form.lugarId}
                setLugarId={form.setLugarId}
                lugarConflictivo={form.lugarConflictivo}
                modalidad={form.modalidad}
                setModalidad={form.setModalidad}
                titulo={form.titulo}
                setTitulo={form.setTitulo}
                resultado={form.resultado}
                setResultado={form.setResultado}
                errors={form.errors}
              />

              <EstudiantesFormSection
                matriculasEstudiantes={form.matriculasEstudiantes}
                estudiantesOptions={form.estudiantesOptions}
                onAddEstudiante={form.handleAddEstudiante}
                onRemoveEstudiante={form.handleRemoveEstudiante}
                onEstudianteChange={form.handleEstudianteChange}
                error={form.errors.estudiantes}
              />
            </div>

            {/* RIGHT COLUMN: Comité Académico */}
            <ComiteAcademicoFormSection
              academicosOptions={form.academicosOptions}
              directorId={form.directorId}
              setDirectorId={form.setDirectorId}
              codirectorId={form.codirectorId}
              setCodirectorId={form.setCodirectorId}
              presidenteId={form.presidenteId}
              setPresidenteId={form.setPresidenteId}
              secretarioId={form.secretarioId}
              setSecretarioId={form.setSecretarioId}
              vocalId={form.vocalId}
              setVocalId={form.setVocalId}
              sinodalId={form.sinodalId}
              setSinodalId={form.setSinodalId}
              errors={form.errors}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-center gap-4 border-t border-slate-300 shrink-0">
            <button
              type="submit"
              disabled={isLoading || !!form.lugarConflictivo}
              className="px-8 py-3 rounded-xl bg-[#00873e] hover:bg-[#007033] active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? 'Guardando...'
                : trabajoToEdit
                ? 'Actualizar Trabajo Recepcional'
                : 'Guardar Trabajo Recepcional'}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 rounded-xl bg-[#8e939d] hover:bg-[#7b8089] active:scale-[0.98] text-white font-semibold text-sm sm:text-base shadow-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
