import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/presentation/components/Button';
import { LogoUV } from '@/presentation/components/LogoUV';
import { LogOut, Shield, Mail, Hash, BookOpen, Clock, FileText } from 'lucide-react';

export const DashboardPlaceholder: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-[#003882] selection:text-white">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <LogoUV size="sm" />
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-800">{user?.nombre}</span>
              <span className="text-xs text-[#003882] font-medium">{user?.rol}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              leftIcon={<LogOut className="w-3.5 h-3.5 text-slate-500" />}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-linear-to-r from-[#003882] to-[#002b66] text-white rounded-2xl p-6 sm:p-8 shadow-lg shadow-blue-950/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs text-blue-100">
              <Shield className="w-3.5 h-3.5 text-emerald-300" />
              <span>Rol Activo: {user?.rol}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Bienvenido(a), {user?.nombre}
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl">
              Sistema de Gestión de Información de Trabajos Recepcionales de la Facultad de Estadística e Informática (SGTR-FEI).
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 text-sm space-y-1 self-stretch md:self-auto">
            <div className="flex items-center gap-2 text-blue-100">
              <Mail className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{user?.correo}</span>
            </div>
            <div className="flex items-center gap-2 text-blue-100">
              <Hash className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>No. Personal: {user?.numeroPersonal}</span>
            </div>
          </div>
        </div>

        {/* Modules summary cards for subsequent development */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#003882] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Trabajos Recepcionales</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Módulo para la consulta, registro y seguimiento del ciclo de vida de los proyectos de titulación de la FEI.
            </p>
            <div className="pt-2">
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                Próxima integración (CU-01 / CU-03)
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00873e] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Emisión Documental</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Checklist de documentación de estudiantes y generación automatizada de constancias y actas oficiales en PDF.
            </p>
            <div className="pt-2">
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                Próxima integración (CU-06)
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Reportes y Auditoría</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Visualización de indicadores, mapeo de relaciones entre comités y exportación de reportes institucionales.
            </p>
            <div className="pt-2">
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                Próxima integración (CU-07)
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
