import { z } from 'zod';

export const loginSchema = z.object({
  correo: z
    .string({ required_error: 'El correo electrónico es requerido' })
    .min(1, 'El correo electrónico es requerido')
    .email('Ingrese un correo electrónico válido (ej. usuario@uv.mx)'),
  contrasenia: z
    .string({ required_error: 'La contraseña es requerida' })
    .min(4, 'La contraseña debe tener al menos 4 caracteres'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
