// ============================================================================
// Login Page - User Authentication
// NOVA Agent - Frontend Development Specialist
// ============================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/utils';

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido')
    .max(254, 'E-mail muito longo'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Login realizado com sucesso!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bem-vindo de volta
        </h1>
        <p className="text-secondary-600">
          Entre com sua conta para acessar seus orçamentos
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            E-mail
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className={cn(
              'input-field',
              errors.email && 'input-error'
            )}
            placeholder="seu@email.com"
            disabled={isSubmitting || isLoading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-error-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Senha
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={cn(
                'input-field pr-10',
                errors.password && 'input-error'
              )}
              placeholder="Sua senha"
              disabled={isSubmitting || isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting || isLoading}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-secondary-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-error-600" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Forgot password link */}
        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
          >
            Esqueceu sua senha?
          </Link>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className={cn(
            'btn-primary w-full',
            (isSubmitting || isLoading) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isSubmitting || isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Entrando...</span>
            </div>
          ) : (
            'Entrar'
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-secondary-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-secondary-500">ou</span>
          </div>
        </div>

        {/* Register link */}
        <div className="text-center">
          <p className="text-secondary-600">
            Não tem uma conta?{' '}
            <Link
              href="/auth/register"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Cadastre-se gratuitamente
            </Link>
          </p>
        </div>
      </form>

      {/* Back to home */}
      <div className="mt-8 pt-6 border-t border-secondary-200 text-center">
        <Link
          href="/"
          className="text-sm text-secondary-500 hover:text-secondary-700 transition-colors"
        >
          ← Voltar ao início
        </Link>
      </div>
    </>
  );
}