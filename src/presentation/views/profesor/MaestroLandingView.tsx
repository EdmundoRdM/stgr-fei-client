import React from 'react';
import {
  Search,
  Plus,
  FileText,
  LogOut,
  Loader2,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Check,
  X,
  Files,
  ScrollText,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMaestroLandingController, type SortField } from '@/controllers/useMaestroLandingController';
import { LogoUV } from '@/presentation/components/LogoUV';
import { ConfirmDialog } from '@/presentation/components/ConfirmDialog';
import { TrabajoModalForm } from './TrabajoModalForm';
import { RecepcionDocumentosModal } from '../secretaria/RecepcionDocumentosModal';
import { FinalizarTrabajoModal } from '../secretaria/FinalizarTrabajoModal';
import type { TrabajoRecepcional } from '@/domain/models/trabajo.types';
import { resolveRoleName, canFinalizarTrabajo } from '@/utils/roleUtils';

export const MaestroLandingView: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    trabajos,
    rawTrabajos,
    isLoading,
    isError,
    searchTerm,
    setSearchTerm,
    sortField,
    sortOrder,
    handleSort,
    handleEnviar,
    handleEliminar,
    handleEditar,
    handleRegistrar,
    handleAceptar,
    handleRechazar,
    handleAbrirDocumentos,
    handleCerrarDocumentos,
    handleGenerarActa,
    handleAbrirFinalizar,
    handleCerrarFinalizar,
    handleFinalizarSubmit,
    isSending,
    isDeleting,
    isValidating,
    isRejecting,
    isGenerandoActa,
    isFinalizando,
    refetch,
    // Modal Props
    isModalOpen,
    trabajoToEdit,
    handleCloseModal,
    handleSaveTrabajo,
    isSaving,
    // Finalizar Modal
    isFinalizarModalOpen,
    trabajoParaFinalizar,
    // Documentos Modal
    isDocumentosModalOpen,
    trabajoParaDocumentos,
    // Confirm Dialog
    confirmDialog,
    handleCloseConfirmDialog,
    userIsDirectivo,
    isSecretariaGrupoUser,
    userNumeroPersonal,
  } = useMaestroLandingController();

  // Helper para renderizar los iconos de ordenamiento en los encabezados
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-3 h-3 text-slate-700 opacity-60 ml-0.5 inline-block shrink-0" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-[#003882] ml-0.5 inline-block shrink-0 stroke-[2.5]" />
    ) : (
      <ChevronDown className="w-3 h-3 text-[#003882] ml-0.5 inline-block shrink-0 stroke-[2.5]" />
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-[#003882] selection:text-white relative">
      {/* Top Navbar in institutional green matching footer */}
      <header className="w-full bg-[#22a353] px-4 sm:px-8 py-2 sticky top-0 z-30 shadow-md">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="bg-white px-3 py-1 rounded-xl shadow-xs flex items-center">
            <LogoUV size="sm" />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right text-white">
              <span className="text-sm font-bold leading-tight">{user?.nombre || 'Docente'}</span>
              <span className="text-xs text-emerald-100 font-semibold">{resolveRoleName(user)}</span>
            </div>

            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs sm:text-sm font-semibold border border-white/30 transition-all cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-4 flex flex-col">
        {/* Title Header */}
        <div className="text-center space-y-0.5 mb-4">
          <h1 className="text-xl sm:text-2xl lg:text-[25px] font-extrabold text-slate-900 tracking-tight">
            Sistema de gestión de trabajos recepcionales
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            Experiencia Recepcional - Sección 1
          </p>
        </div>

        {/* Action Bar (Search & Register) */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-3.5">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80 md:w-96">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-full bg-[#e2e5ea] hover:bg-[#d9dce2] focus:bg-white border border-transparent focus:border-[#003882] py-1.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#003882]/20 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => refetch()}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Recargar datos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleRegistrar}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#cfd2d8] hover:bg-[#c3c7d0] active:scale-[0.98] px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 border border-slate-300 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Trabajo Recepcional</span>
            </button>
          </div>
        </div>

        {/* Data Table Container with prototype colors */}
        <div className="w-full overflow-x-auto rounded-xl border border-slate-300 shadow-xs bg-white">
          <table className="w-full text-xs text-left border-collapse table-auto">
            {/* Table Header matching prototype exactly */}
            <thead>
              <tr className="bg-[#b8bcc4] text-slate-900 font-bold border-b border-white select-none">
                {/* Folio del Acta (Compacto y Ordenable) */}
                <th
                  onClick={() => handleSort('folio')}
                  className="w-16 min-w-[65px] max-w-[75px] py-2 px-1 text-center border-r border-white hover:bg-[#a8acb4] transition-colors cursor-pointer whitespace-nowrap"
                  title="Clic para ordenar por folio"
                >
                  <div className="inline-flex items-center justify-center">
                    <span className="text-[11px]">Folio del Acta</span>
                    {renderSortIndicator('folio')}
                  </div>
                </th>

                {/* Licenciatura */}
                <th className="min-w-[100px] max-w-[125px] py-2 px-1.5 text-center border-r border-white text-[11px]">
                  Licenciatura
                </th>

                {/* Profesor */}
                <th className="min-w-[130px] max-w-[160px] py-2 px-2 text-center border-r border-white text-[11px]">
                  Profesor
                </th>

                {/* Participación */}
                <th className="min-w-[95px] max-w-[110px] py-2 px-1 text-center border-r border-white text-[11px]">
                  Participación
                </th>

                {/* Título del Trabajo */}
                <th className="min-w-[180px] max-w-[260px] py-2 px-2.5 text-center border-r border-white text-[11px]">
                  Título del Trabajo
                </th>

                {/* Modalidad (Ordenable) */}
                <th
                  onClick={() => handleSort('modalidad')}
                  className="w-20 min-w-[75px] max-w-[85px] py-2 px-1 text-center border-r border-white hover:bg-[#a8acb4] transition-colors cursor-pointer whitespace-nowrap"
                  title="Clic para ordenar por modalidad"
                >
                  <div className="inline-flex items-center justify-center">
                    <span className="text-[11px]">Modalidad</span>
                    {renderSortIndicator('modalidad')}
                  </div>
                </th>

                {/* Nombre del alumno */}
                <th className="min-w-[110px] max-w-[140px] py-2 px-1.5 text-center border-r border-white text-[11px]">
                  Nombre del alumno
                </th>

                {/* Fecha de defensa (Compacto y Ordenable) */}
                <th
                  onClick={() => handleSort('fecha')}
                  className="w-20 min-w-[75px] max-w-[85px] py-2 px-1 text-center border-r border-white hover:bg-[#a8acb4] transition-colors cursor-pointer whitespace-nowrap"
                  title="Clic para ordenar por fecha de defensa"
                >
                  <div className="inline-flex items-center justify-center">
                    <span className="text-[11px]">Fecha de defensa</span>
                    {renderSortIndicator('fecha')}
                  </div>
                </th>

                {/* Resultado Obtenido */}
                <th className="w-24 min-w-[90px] max-w-[100px] py-2 px-1 text-center border-r border-white text-[11px]">
                  Resultado Obtenido
                </th>

                {/* Estado */}
                <th className="w-20 min-w-[75px] max-w-[85px] py-2 px-1 text-center border-r border-white text-[11px] whitespace-nowrap">
                  Estado
                </th>

                {/* Opciones */}
                <th className="w-24 min-w-[90px] max-w-[115px] py-2 px-1 text-center text-[11px] whitespace-nowrap">
                  Opciones
                </th>
              </tr>
            </thead>

            {/* Table Body with prototype alternating colors and white grid lines */}
            <tbody className="text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 bg-[#eaedf2]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 text-[#003882] animate-spin" />
                      <span className="font-medium text-xs">Cargando trabajos recepcionales...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-red-600 bg-red-50">
                    <p className="font-semibold text-xs">Ocurrió un error al cargar los registros.</p>
                    <button
                      onClick={() => refetch()}
                      className="mt-1.5 text-xs font-semibold text-[#003882] underline cursor-pointer"
                    >
                      Reintentar conexión
                    </button>
                  </td>
                </tr>
              ) : trabajos.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-500 bg-[#eaedf2]">
                    <p className="font-medium text-xs">No se encontraron trabajos recepcionales registrados.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {searchTerm ? 'Pruebe con otro término de búsqueda' : 'Utilice el botón "Registrar Trabajo Recepcional" para dar de alta uno'}
                    </p>
                  </td>
                </tr>
              ) : (
                trabajos.map((trabajo: TrabajoRecepcional, index: number) => {
                  const estadoNombre = trabajo.EstadoListum?.EstadoNombre || 'Borrador';
                  const isBorrador = estadoNombre === 'Borrador';
                  const isEven = index % 2 === 0;

                  // Extract academic participants and assigned students
                  const participantes = trabajo.academicos || trabajo.ParticipantesTrabajos || [];
                  const estudiantes = trabajo.estudiantes || trabajo.EstudianteTrabajos || [];

                  return (
                    <tr
                      key={trabajo.Id_TrabajoR || index}
                      className={`hover:bg-[#d8dce4] transition-colors border-b border-white ${
                        isEven ? 'bg-[#eaedf2]' : 'bg-[#e2e5ea]'
                      }`}
                    >
                      {/* Folio (Compacto) */}
                      <td className="w-16 min-w-[65px] max-w-[75px] py-2 px-1 text-center border-r border-white font-medium text-slate-700 text-[11px] whitespace-nowrap">
                        {trabajo.Folio || 'Pendiente'}
                      </td>

                      {/* Licenciatura */}
                      <td className="min-w-[100px] max-w-[125px] py-2 px-1.5 text-center border-r border-white font-medium text-slate-800 leading-tight text-[11px]">
                        {trabajo.Carrera?.NombreCarrera || 'Ingeniería de Software'}
                      </td>

                      {/* Profesores (Stack vertical con divisores blancos idénticos al prototipo) */}
                      <td className="min-w-[130px] max-w-[160px] p-0 border-r border-white align-top">
                        {participantes.length > 0 ? (
                          <div className="flex flex-col h-full justify-between">
                            {participantes.map((p, idx) => {
                              const nombreCompleto = `${p.Academico?.Nombre || ''} ${p.Academico?.ApellidoP || ''} ${p.Academico?.ApellidoM || ''}`.trim();
                              return (
                                <div
                                  key={p.Id_Participacion || idx}
                                  className="py-1.5 px-2 text-[10px] sm:text-[10.5px] font-bold text-slate-800 uppercase leading-tight border-b border-white last:border-b-0"
                                >
                                  {nombreCompleto || 'DOCENTE FEI'}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-2 px-2 text-slate-400 italic text-[10px]">No asignados</div>
                        )}
                      </td>

                      {/* Participación (Roles con icono de documento y divisores) */}
                      <td className="min-w-[95px] max-w-[110px] p-0 border-r border-white align-top">
                        {participantes.length > 0 ? (
                          <div className="flex flex-col h-full justify-between">
                            {participantes.map((p, idx) => {
                              const rolNombre = p.RolDeParticipacion?.NombreRol || p.Rol_de_participacion?.NombreRol || 'DIRECTOR';
                              return (
                                <div
                                  key={p.Id_Participacion || idx}
                                  className="py-1.5 px-1.5 text-[10px] font-semibold text-slate-600 uppercase flex items-center justify-between gap-1 border-b border-white last:border-b-0"
                                >
                                  <span className="tracking-tight">{rolNombre}</span>
                                  <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-2 px-1 text-slate-400 text-center">-</div>
                        )}
                      </td>

                      {/* Título del Trabajo (En comillas según prototipo) */}
                      <td className="min-w-[180px] max-w-[260px] py-2 px-2.5 border-r border-white text-[11px] text-slate-800 leading-snug font-medium">
                        &ldquo;{trabajo.Titulo}&rdquo;
                      </td>

                      {/* Modalidad */}
                      <td className="w-20 min-w-[75px] max-w-[85px] py-2 px-1 text-center border-r border-white font-medium text-slate-700 text-[11px] whitespace-nowrap">
                        {trabajo.Modalidad || 'Tesis'}
                      </td>

                      {/* Nombre del alumno */}
                      <td className="min-w-[110px] max-w-[140px] py-2 px-1.5 text-center border-r border-white font-semibold text-slate-800 text-[11px] leading-tight">
                        {estudiantes.length > 0 ? (
                          <div className="space-y-1">
                            {estudiantes.map((e, idx) => (
                              <div key={e.Id_EstudianteTrabajo || idx}>
                                {e.Estudiante?.NombreCompleto || e.Estudiante?.Matricula || 'Alumno Registrado'}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Pendiente</span>
                        )}
                      </td>

                      {/* Fecha de defensa (Compacto) */}
                      <td className="w-20 min-w-[75px] max-w-[85px] py-2 px-1 text-center border-r border-white text-slate-700 whitespace-nowrap font-mono text-[10.5px]">
                        {trabajo.Fecha_defensa ? trabajo.Fecha_defensa.split('T')[0] : 'Por definir'}
                      </td>

                      {/* Resultado Obtenido */}
                      <td className="w-24 min-w-[90px] max-w-[100px] py-2 px-1 text-center border-r border-white text-[10.5px] font-bold text-slate-700 leading-tight">
                        {trabajo.Resultado || 'Pendiente'}
                      </td>

                      {/* Estado (Texto en negrita directo según prototipo) */}
                      <td className="w-20 min-w-[75px] max-w-[85px] py-2 px-1 text-center border-r border-white font-bold text-[11px] text-slate-800 whitespace-nowrap">
                        {estadoNombre}
                      </td>

                      {/* Opciones (RBAC para CU-01 a CU-06) */}
                      <td className="w-24 min-w-[90px] max-w-[115px] py-1.5 px-1 text-center align-middle">
                        {isBorrador ? (
                          <div className="flex flex-col items-center gap-1 w-full">
                            <button
                              onClick={() => handleEditar(trabajo)}
                              className="w-16 py-0.5 rounded bg-[#f39c12] hover:bg-[#d68910] active:scale-95 text-white font-bold text-[10px] shadow-2xs transition-all cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleEliminar(trabajo.Id_TrabajoR)}
                              className="w-16 py-0.5 rounded bg-[#e74c3c] hover:bg-[#c0392b] active:scale-95 text-white font-bold text-[10px] shadow-2xs transition-all cursor-pointer"
                            >
                              Eliminar
                            </button>
                            <button
                              onClick={() => handleEnviar(trabajo.Id_TrabajoR)}
                              className="w-16 py-0.5 rounded bg-[#3498db] hover:bg-[#2980b9] active:scale-95 text-white font-bold text-[10px] shadow-2xs transition-all cursor-pointer"
                            >
                              Enviar
                            </button>
                          </div>
                        ) : estadoNombre === 'Registrado' ? (
                          userIsDirectivo ? (
                            <div className="flex flex-col items-center gap-1 w-full">
                              <button
                                onClick={() => handleEditar(trabajo)}
                                className="w-16 py-0.5 rounded bg-[#f39c12] hover:bg-[#d68910] active:scale-95 text-white font-bold text-[10px] shadow-2xs transition-all cursor-pointer"
                                title="Editar trabajo recepcional"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleAceptar(trabajo)}
                                className="w-16 py-0.5 rounded bg-[#00873e] hover:bg-[#007033] active:scale-95 text-white font-bold text-[10px] shadow-2xs transition-all flex items-center justify-center gap-0.5 cursor-pointer"
                                title="Aceptar y aprobar trabajo recepcional"
                              >
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                <span>Aceptar</span>
                              </button>
                              <button
                                onClick={() => handleRechazar(trabajo)}
                                className="w-16 py-0.5 rounded bg-[#e74c3c] hover:bg-[#c0392b] active:scale-95 text-white font-bold text-[10px] shadow-2xs transition-all flex items-center justify-center gap-0.5 cursor-pointer"
                                title="Rechazar y regresar a borrador"
                              >
                                <X className="w-2.5 h-2.5 stroke-[3]" />
                                <span>Rechazar</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-500 italic">
                              En revisión
                            </span>
                          )
                        ) : estadoNombre === 'Aprobado' ? (
                          isSecretariaGrupoUser || userIsDirectivo ? (
                            <div className="flex flex-col items-center gap-1 w-full">
                              {/* Botón Documentación */}
                              <button
                                onClick={() => handleAbrirDocumentos(trabajo)}
                                className="w-22 py-0.5 rounded bg-[#003882] hover:bg-[#00275c] active:scale-95 text-white font-bold text-[10px] shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                                title="Control documental de recepción de requisitos"
                              >
                                <Files className="w-2.5 h-2.5" />
                                <span>Documentación</span>
                              </button>

                              {/* Botón Generar Acta (Visible si y solo si se completa el checklist de documentos) */}
                              {trabajo.checklistCompleto && (
                                <button
                                  onClick={() => handleGenerarActa(trabajo)}
                                  className="w-22 py-0.5 rounded bg-[#00873e] hover:bg-[#007033] active:scale-95 text-white font-bold text-[10px] shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer animate-fadeIn"
                                  title="Generar acta oficial de trabajo recepcional"
                                >
                                  <ScrollText className="w-2.5 h-2.5 stroke-[2.5]" />
                                  <span>Generar acta</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleEditar(trabajo)}
                                className="w-22 py-0.5 rounded bg-[#f39c12] hover:bg-[#d68910] active:scale-95 text-white font-bold text-[10px] shadow-2xs transition-all cursor-pointer"
                                title="Editar trabajo recepcional"
                              >
                                Editar
                              </button>

                              {userIsDirectivo && (
                                <button
                                  onClick={() => handleEliminar(trabajo.Id_TrabajoR)}
                                  className="w-22 py-0.5 rounded bg-[#e74c3c] hover:bg-[#c0392b] active:scale-95 text-white font-bold text-[10px] shadow-2xs transition-all cursor-pointer"
                                  title="Eliminar trabajo recepcional"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-500 italic">
                              Aprobado
                            </span>
                          )
                        ) : isSecretariaGrupoUser || userIsDirectivo ? (
                          <div className="flex flex-col items-center gap-1 w-full">
                            {/* Botón Finalizar: Visible si el trabajo está en 'Generado' y el usuario tiene permisos */}
                            {estadoNombre === 'Generado' && canFinalizarTrabajo(user) && (
                              <button
                                onClick={() => handleAbrirFinalizar(trabajo)}
                                className="w-16 py-0.5 rounded bg-[#00873e] hover:bg-[#007033] active:scale-95 text-white font-bold text-[10px] shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1 animate-fadeIn"
                                title="Finalizar trabajo recepcional (asignar folio de acta y resultado)"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5 stroke-[2.5]" />
                                <span>Finalizar</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleEditar(trabajo)}
                              className="w-16 py-0.5 rounded bg-[#f39c12] hover:bg-[#d68910] active:scale-95 text-white font-bold text-[10px] shadow-2xs transition-all cursor-pointer"
                              title="Editar trabajo recepcional"
                            >
                              Editar
                            </button>
                            {userIsDirectivo && (
                              <button
                                onClick={() => handleEliminar(trabajo.Id_TrabajoR)}
                                className="w-16 py-0.5 rounded bg-[#e74c3c] hover:bg-[#c0392b] active:scale-95 text-white font-bold text-[10px] shadow-2xs transition-all cursor-pointer"
                                title="Eliminar trabajo recepcional"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-500 italic">
                            {estadoNombre}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal Form for Register / Edit */}
      <TrabajoModalForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTrabajo}
        trabajoToEdit={trabajoToEdit}
        existingTrabajos={rawTrabajos}
        isLoading={isSaving}
      />

      {/* Modal Form for Finalizar Trabajo Recepcional */}
      <FinalizarTrabajoModal
        isOpen={isFinalizarModalOpen}
        onClose={handleCerrarFinalizar}
        trabajo={trabajoParaFinalizar}
        onFinalizar={handleFinalizarSubmit}
        isLoading={isFinalizando}
      />

      {/* Modal de Recepción de Documentos (CU-06) */}
      <RecepcionDocumentosModal
        isOpen={isDocumentosModalOpen}
        onClose={handleCerrarDocumentos}
        trabajo={trabajoParaDocumentos}
        numeroPersonal={userNumeroPersonal}
      />

      {/* In-App Confirmation Modal Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={handleCloseConfirmDialog}
        isLoading={isSending || isDeleting || isValidating || isRejecting || isGenerandoActa || isFinalizando}
      />

      {/* Bottom Dual Institutional Stripes */}
      <div className="w-full relative mt-6 select-none shrink-0">
        <div className="w-full h-4 sm:h-5 bg-[#003882]" />
        <div className="w-full h-1 sm:h-1.5 bg-white" />
        <div className="w-full h-10 sm:h-14 bg-[#22a353]" />
      </div>
    </div>
  );
};
