import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLoginController } from '@/controllers/useLoginController';
import { InputField } from '@/presentation/components/InputField';
import { Button } from '@/presentation/components/Button';

export const LoginView: React.FC = () => {
  const {
    register,
    onSubmit,
    errors,
    isLoading,
    showPassword,
    toggleShowPassword,
  } = useLoginController();

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center">
      {/* Title Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-slate-900 tracking-tight leading-snug">
          Sistema de gestión de trabajos
          <br />
          recepcionales
        </h1>
      </div>

      {/* Form Container */}
      <form onSubmit={onSubmit} className="w-full max-w-[340px] sm:max-w-[380px] space-y-4 sm:space-y-5" noValidate>
        {/* Email Field */}
        <div>
          <InputField
            label="Correo Institucional:"
            type="email"
            variant="filled"
            autoComplete="email"
            placeholder="correoInstitucional@Fei.uv.mx"
            error={errors.correo?.message}
            {...register('correo')}
          />
        </div>

        {/* Password Field */}
        <div>
          <InputField
            label="Contraseña:"
            type={showPassword ? 'text' : 'password'}
            variant="filled"
            autoComplete="current-password"
            placeholder="************"
            rightElement={
              <button
                type="button"
                onClick={toggleShowPassword}
                className="p-1.5 text-slate-500 hover:text-slate-700 focus:outline-none transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            error={errors.contrasenia?.message}
            {...register('contrasenia')}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-center">
          <Button
            type="submit"
            variant="green"
            pill
            size="md"
            className="w-full py-2.5 sm:py-3 text-sm sm:text-base font-bold tracking-wide shadow-sm hover:shadow-md active:scale-[0.99] transition-all"
            isLoading={isLoading}
          >
            Iniciar Sesión
          </Button>
        </div>
      </form>
    </div>
  );
};
