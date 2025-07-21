import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    const [validationErrors, setValidationErrors] = useState<{
        email?: string;
        password?: string;
    }>({});

    // Função para validar email
    const validateEmail = (email: string) => {
        if (!email.trim()) {
            return 'Preencha este campo.';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Insira um endereço de email válido.';
        }
        return '';
    };

    // Função para validar senha
    const validatePassword = (password: string) => {
        if (!password.trim()) {
            return 'Preencha este campo.';
        }
        return '';
    };

    // Handler para mudança no email
    const handleEmailChange = (value: string) => {
        setData('email', value);
        
        // Limpar erros do servidor quando o usuário começar a digitar
        if (errors.email) {
            clearErrors('email');
        }
        
        const error = validateEmail(value);
        
        // Atualiza os erros - remove se não houver erro
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            if (error) {
                newErrors.email = error;
            } else {
                delete newErrors.email;
            }
            return newErrors;
        });
    };

    // Handler para mudança na senha
    const handlePasswordChange = (value: string) => {
        setData('password', value);
        
        // Limpar erros do servidor quando o usuário começar a digitar
        if (errors.password || errors.email) {
            clearErrors(); // Limpa todos os erros do servidor, incluindo "credenciais não conferem"
        }
        
        const error = validatePassword(value);
        
        // Atualiza os erros - remove se não houver erro
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            if (error) {
                newErrors.password = error;
            } else {
                delete newErrors.password;
            }
            return newErrors;
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Validar campos antes de enviar
        const emailError = validateEmail(data.email);
        const passwordError = validatePassword(data.password);
        
        if (emailError || passwordError) {
            const newErrors: { email?: string; password?: string } = {};
            if (emailError) newErrors.email = emailError;
            if (passwordError) newErrors.password = passwordError;
            setValidationErrors(newErrors);
            return;
        }

        // Limpar erros de validação local
        setValidationErrors({});
        
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Entre na sua conta SAGE" description="Insira seu email e senha abaixo para fazer login">
            <Head title="Entre na sua conta" />

            <form className="flex flex-col gap-6" onSubmit={submit} noValidate>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            placeholder="email@exemplo.com"
                            className={(errors.email || validationErrors.email) ? 'border-red-500' : ''}
                        />
                        <div className="min-h-[20px]">
                            <InputError message={errors.email || validationErrors.email} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center -mt-3">
                            <Label htmlFor="password">Senha</Label>
                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="ml-auto text-sm" tabIndex={5}>
                                    Esqueceu a senha?
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => handlePasswordChange(e.target.value)}
                            placeholder="Senha"
                            className={(errors.password || validationErrors.password) ? 'border-red-500' : ''}
                        />
                        <div className="min-h-[20px]">
                            <InputError message={errors.password || validationErrors.password} />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 -mt-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onClick={() => setData('remember', !data.remember)}
                            tabIndex={3}
                        />
                        <Label htmlFor="remember">Lembre-se de mim</Label>
                    </div>

                    <Button type="submit" className="mt-4 w-full mt-2" tabIndex={4} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                     Entrar
                    </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground -mt-3">
                    Não tem uma conta?{' '}
                    <TextLink href={route('register')} tabIndex={5}>
                        Cadastre-se
                    </TextLink>
                </div>
            </form>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}