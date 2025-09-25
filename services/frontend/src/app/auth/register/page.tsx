// ============================================================================
// Register Page - User Registration
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

// Brazilian phone validation function
const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[^\d]/g, '');
  // Brazilian mobile format: 11 digits (including area code)
  // Format: (XX) 9XXXX-XXXX
  return cleaned.length === 11 && cleaned[2] === '9';
};

// Validation schema
const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome muito longo'),
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido')
    .max(254, 'E-mail muito longo'),
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .refine((phone) => validatePhone(phone), 'Telefone celular inválido. Use o formato (XX) 9XXXX-XXXX'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  terms: z.boolean().refine((val) => val === true, 'Você deve aceitar os termos'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await fetch('http://127.0.0.1:3000/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.errors?.[0] || result.message || 'Erro ao criar conta');
      }

      // Success - user registered and received tokens
      toast.success('Conta criada com sucesso!');
      toast('🎉 Você já está logado e pode começar a usar a plataforma!', {
        duration: 4000,
        icon: '✨',
      });

      // Store the tokens (you might want to use a proper auth store)
      if (result.data?.tokens) {
        localStorage.setItem('access_token', result.data.tokens.accessToken);
        localStorage.setItem('refresh_token', result.data.tokens.refreshToken);
      }

      // Redirect to dashboard or main area
      router.push('/dashboard');

    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Erro ao criar conta');
    }
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Criar conta gratuita
        </h1>
        <p className="text-secondary-600">
          Comece a criar orçamentos profissionais em minutos
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nome completo
          </label>
          <input
            {...register('name')}
            type="text"
            autoComplete="name"
            className={cn(
              'input-field',
              errors.name && 'input-error'
            )}
            placeholder="Seu nome completo"
            disabled={isSubmitting || isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-error-600" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

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

        {/* Phone field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Telefone Celular
          </label>
          <input
            {...register('phone')}
            type="tel"
            autoComplete="tel"
            maxLength={15}
            className={cn(
              'input-field',
              errors.phone && 'input-error'
            )}
            placeholder="(11) 99999-9999"
            disabled={isSubmitting || isLoading}
            onChange={(e) => {
              e.target.value = formatPhone(e.target.value);
            }}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-error-600" role="alert">
              {errors.phone.message}
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
              autoComplete="new-password"
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

        {/* Confirm Password field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirmar senha
          </label>
          <div className="relative">
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={cn(
                'input-field pr-10',
                errors.confirmPassword && 'input-error'
              )}
              placeholder="Confirme sua senha"
              disabled={isSubmitting || isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isSubmitting || isLoading}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-secondary-400" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-error-600" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Terms checkbox */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              {...register('terms')}
              type="checkbox"
              className={cn(
                'h-4 w-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500',
                errors.terms && 'border-error-300'
              )}
              disabled={isSubmitting || isLoading}
            />
          </div>
          <div className="ml-3">
            <label className="text-sm text-gray-700">
              Concordo com os{' '}
              <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                termos de uso
              </Link>{' '}
              e{' '}
              <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                política de privacidade
              </Link>
            </label>
            {errors.terms && (
              <p className="mt-1 text-sm text-error-600" role="alert">
                {errors.terms.message}
              </p>
            )}
          </div>
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
              <span>Criando conta...</span>
            </div>
          ) : (
            'Criar conta gratuita'
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

        {/* Login link */}
        <div className="text-center">
          <p className="text-secondary-600">
            Já tem uma conta?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Faça login
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