import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { loginSchema, type LoginFormValues } from '@/domain/schemas/auth.schema';
import { authService } from '@/services/auth/authService';
import { useAuth } from '@/context/AuthContext';

export const useLoginController = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      correo: '',
      contrasenia: '',
    },
    mode: 'onTouched',
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => authService.login(values),
    onSuccess: (data) => {
      login(data.usuario);
      toast.success(`¡Bienvenido(a), ${data.usuario.nombre}!`, {
        description: `Sesión iniciada con rol: ${data.usuario.rol}`,
      });
      navigate('/dashboard', { replace: true });
    },
    onError: (error: Error) => {
      toast.error('Error al iniciar sesión', {
        description: error.message || 'Verifique sus credenciales e intente nuevamente.',
      });
    },
  });

  const onSubmit = handleSubmit((data) => {
    loginMutation.mutate(data);
  });

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return {
    register,
    onSubmit,
    errors,
    isLoading: loginMutation.isPending,
    showPassword,
    toggleShowPassword,
  };
};
