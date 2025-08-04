import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Camera, Trash2, User } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Configurações de Perfil',
        href: '/configuracoes/perfil',
    },
];

type ProfileForm = {
    name: string;
    email: string;
    profile_photo?: File | null;
};

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const { toast } = useToast();

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm<ProfileForm>({
        name: auth.user.name,
        email: auth.user.email,
        profile_photo: null,
    });

    const refreshSystemAfterPhotoUpdate = (photoUrl?: string) => {
        const timestamp = Date.now();
        
        // Disparar evento customizado para notificar outros componentes
        window.dispatchEvent(new CustomEvent('profile-photo-updated', { 
            detail: { timestamp, userId: auth.user.id } 
        }));

        // Invalidar cache de todas as imagens de perfil na aplicação
        const profileImages = document.querySelectorAll('img[src*="profile_photo"], img[src*="/storage/"], img[alt*="perfil"], img[alt*="profile"]');
        profileImages.forEach((img: Element) => {
            const imgElement = img as HTMLImageElement;
            const originalSrc = imgElement.src.split('?')[0]; // Remove query params existentes
            imgElement.src = originalSrc + '?v=' + timestamp;
        });

        // Forçar atualização de todas as imagens de avatar na aplicação
        setTimeout(() => {
            const allAvatars = document.querySelectorAll('img[alt*="' + auth.user.name + '"]');
            allAvatars.forEach((img: Element) => {
                const imgElement = img as HTMLImageElement;
                const originalSrc = imgElement.src.split('?')[0];
                imgElement.src = originalSrc + '?v=' + timestamp;
            });
        }, 100);

        // Refresh automático do sistema para dar tempo do toast aparecer
        setTimeout(() => {
            window.location.reload();
        }, 2500);
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            // Upload automático da foto
            const formData = new FormData();
            formData.append('profile_photo', file);
            formData.append('name', data.name);
            formData.append('email', data.email);
            formData.append('_method', 'PATCH');

            router.post(route('profile.update'), formData, {
                preserveScroll: true,
                onSuccess: () => {
                    setPhotoPreview(null);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                    
                    // Mostrar toast de sucesso por 5 segundos
                    toast({
                        title: "Foto alterada com sucesso!",
                        description: "Sua foto de perfil foi atualizada em todo o sistema.",
                        duration: 5000,
                    });
                    
                    // Refresh automático do sistema após atualização da foto
                    refreshSystemAfterPhotoUpdate(currentPhotoUrl || undefined);
                },
                onError: (errors) => {
                    console.error('Erro ao atualizar perfil:', errors);
                    toast({
                        title: "Erro ao alterar foto",
                        description: "Ocorreu um erro ao atualizar sua foto de perfil. Tente novamente.",
                        variant: "destructive",
                        duration: 5000,
                    });
                },
            });
        }
    };

    const handlePhotoRemove = () => {
        const oldPhotoUrl = currentPhotoUrl;
        
        router.delete(route('profile.photo.remove'), {
            preserveScroll: true,
            onSuccess: () => {
                setPhotoPreview(null);
                setData('profile_photo', null);
                
                // Mostrar toast de sucesso por 5 segundos
                toast({
                    title: "Foto removida com sucesso!",
                    description: "Sua foto de perfil foi removida e as iniciais foram restauradas.",
                    duration: 5000,
                });
                
                // Refresh automático do sistema após remoção da foto
                refreshSystemAfterPhotoUpdate(oldPhotoUrl || undefined);
            },
            onError: (errors) => {
                console.error('Erro ao remover foto:', errors);
                toast({
                    title: "Erro ao remover foto",
                    description: "Ocorreu um erro ao remover sua foto de perfil. Tente novamente.",
                    variant: "destructive",
                    duration: 5000,
                });
            },
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Usar o patch do useForm
        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                // Mostrar toast de sucesso por 5 segundos
                toast({
                    title: "Perfil atualizado com sucesso!",
                    description: "Suas informações pessoais foram salvas.",
                    duration: 5000,
                });
            },
            onError: (errors: any) => {
                console.error('Erro ao atualizar perfil:', errors);
                
                // Mostrar toast de erro
                const errorMessages = Object.values(errors).flat();
                const errorMessage = errorMessages.length > 0 ? errorMessages[0] as string : "Erro ao atualizar perfil";
                
                toast({
                    title: "Erro ao salvar perfil",
                    description: errorMessage,
                    variant: "destructive",
                    duration: 5000,
                });
            },
        });
    };

    // Get current profile photo URL with cache busting
    const currentPhotoUrl = auth.user.profile_photo 
        ? `/storage/${auth.user.profile_photo}?v=${new Date(auth.user.updated_at).getTime()}` 
        : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configurações de Perfil" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Foto de perfil" description="Adicione ou altere sua foto de perfil" />

                    {/* Profile Photo Section */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                                {photoPreview || currentPhotoUrl ? (
                                    <img
                                        src={photoPreview || currentPhotoUrl || ''}
                                        alt="Foto de perfil"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-muted-foreground" />
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 dark:bg-blue-950/50 dark:border-blue-800/50 dark:text-blue-300 dark:hover:bg-blue-900/50 dark:hover:border-blue-700/50 dark:hover:text-blue-200 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                            >
                                <Camera className="w-4 h-4" />
                                {currentPhotoUrl ? 'Alterar foto' : 'Adicionar foto'}
                            </Button>

                            {(currentPhotoUrl || photoPreview) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handlePhotoRemove}
                                    className="flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 hover:text-red-800 dark:bg-red-950/50 dark:border-red-800/50 dark:text-red-300 dark:hover:bg-red-900/50 dark:hover:border-red-700/50 dark:hover:text-red-200 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Remover
                                </Button>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoSelect}
                            className="hidden"
                        />
                    </div>

                    <InputError message={errors.profile_photo} />

                    <HeadingSmall title="Informações pessoais" description="Atualize seu nome e endereço de email" />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome</Label>

                            <Input
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                autoComplete="name"
                                placeholder="Nome completo"
                            />

                            <InputError className="mt-2" message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>

                            <Input
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="username"
                                placeholder="Endereço de email"
                            />

                            <InputError className="mt-2" message={errors.email} />
                        </div>

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div>
                                <p className="-mt-4 text-sm text-muted-foreground">
                                    Seu endereço de email não está verificado.{' '}
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                    >
                                        Clique aqui para reenviar o link de verificação.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        Um novo link de verificação foi enviado para o seu endereço de email.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Salvar</Button>
                        </div>
                    </form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
