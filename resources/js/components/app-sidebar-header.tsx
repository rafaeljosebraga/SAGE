import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Bell, Moon, Sun } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NotificationsModal } from '@/components/ui/NotificationsModal';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notifications, setNotifications] = useState([]);

    // Carrega o tema salvo
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (storedTheme === 'dark') {
            document.documentElement.classList.add('dark');
            setTheme('dark');
        } else {
            document.documentElement.classList.remove('dark');
            setTheme('light');
        }
    }, []);

    // Carrega as notificações quando o modal é aberto
    useEffect(() => {
        fetchNotifications();
    }, [isNotificationsOpen]);

    // Alterna o tema
    const toggleTheme = () => {
        setHasInteracted(true);
        if (theme === 'dark') {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setTheme('light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setTheme('dark');
        }
    };

    const toggleNotifications = () => {
        setIsNotificationsOpen(!isNotificationsOpen);
    };

    // Busca notificações do usuário
    const fetchNotifications = async () => {
        try {
            // Substitua pelo ID do usuário logado
            const userId = 1; // Isso deve vir do contexto de autenticação
            const response = await fetch(`notificacoes/user/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
                setNotificationCount(data.length);

                // Calcula quantas notificações não lidas
            }
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    };


    return (
        <>
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            {/* Botão de Notificações com Contador */}
            <div className="flex items-center gap-3">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={toggleNotifications}
                            className="relative cursor-pointer text-muted-foreground hover:text-foreground transition-all duration-300 p-2 rounded-lg hover:bg-sidebar-accent/50 hover:scale-105 active:scale-95"
                        >
                            <Bell className="h-5 w-5" />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                {notificationCount > 99 ? '99+' : notificationCount}
                            </span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        <p>Notificações</p>
                    </TooltipContent>
                </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={toggleTheme}
                        className="cursor-pointer relative text-muted-foreground hover:text-foreground transition-all duration-300 p-2 rounded-lg hover:bg-sidebar-accent/50 hover:scale-105 active:scale-95"
                    >
                        <div className="relative w-5 h-5">
                            {/* Sun Icon */}
                            <Sun
                                className={`absolute inset-0 h-5 w-5 text-yellow-400 ${
                                    hasInteracted ? 'transition-all duration-500 ease-in-out' : ''
                                } ${
                                    theme === 'dark'
                                        ? 'opacity-100 rotate-0 scale-100'
                                        : 'opacity-0 rotate-180 scale-75'
                                }`}
                                style={{
                                    filter: theme === 'dark' ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.3))' : 'none'
                                }}
                            />
                            {/* Moon Icon */}
                            <Moon
                                className={`absolute inset-0 h-5 w-5 text-blue-500 ${
                                    hasInteracted ? 'transition-all duration-500 ease-in-out' : ''
                                } ${
                                    theme === 'light'
                                        ? 'opacity-100 rotate-0 scale-100'
                                        : 'opacity-0 -rotate-180 scale-75'
                                }`}
                                style={{
                                    filter: theme === 'light' ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))' : 'none'
                                }}
                            />
                        </div>
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>Alternar tema</p>
                </TooltipContent>
            </Tooltip>
            </div>
        </header>

            <NotificationsModal
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notifications}
            />
        </>
    );
}
