import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

import HeadingSmall from '@/components/heading-small';

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm<Required<{ password: string }>>({ password: '' });

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                
                // Mostrar toast de sucesso por 5 segundos
                toast({
                    title: "Conta apagada com sucesso!",
                    description: "Sua conta e todos os dados foram permanentemente removidos.",
                    duration: 5000,
                });
            },
            onError: (errors) => {
                passwordInput.current?.focus();
                
                // Mostrar toast de erro
                const errorMessages = Object.values(errors).flat();
                const errorMessage = errorMessages.length > 0 ? errorMessages[0] as string : "Erro ao apagar conta";
                
                toast({
                    title: "Erro ao apagar conta",
                    description: errorMessage,
                    variant: "destructive",
                    duration: 5000,
                });
            },
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        clearErrors();
        reset();
    };

    return (
        <div className="space-y-6">
            <HeadingSmall title="Apagar Conta" description="Delete sua conta e todos os seus recursos" />
            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                    <p className="font-medium">Atenção</p>
                    <p className="text-sm">Por favor, prossiga com cautela, isso não pode ser desfeito.</p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="destructive">Apagar conta</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>Tem certeza de que deseja apagar sua conta?</DialogTitle>
                        <DialogDescription>
                            Uma vez que sua conta é apagada, todos os seus recursos e dados também serão permanentemente excluídos. Por favor, insira sua senha
                            para confirmar que você deseja apagar sua conta permanentemente.
                        </DialogDescription>
                        <form className="space-y-6" onSubmit={deleteUser}>
                            <div className="grid gap-2">
                                <Label htmlFor="password" className="sr-only">
                                    Password
                                </Label>

                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    ref={passwordInput}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Senha"
                                    autoComplete="current-password"
                                />

                                <InputError message={errors.password} />
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary" onClick={closeModal}>
                                        Cancelar
                                    </Button>
                                </DialogClose>

                                <Button variant="destructive" disabled={processing} asChild>
                                    <button type="submit">Apagar a conta</button>
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
