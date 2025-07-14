import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCanManageUsers } from '@/hooks/use-auth';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Moon, Sun, Users } from 'lucide-react';
import AppLogo from './app-logo';
import { useEffect, useState } from 'react';

export function AppSidebar() {
    const canManageUsers = useCanManageUsers();

    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Carrega o tema salvo ao iniciar
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

    // Alterna entre claro e escuro
    const toggleTheme = () => {
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

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
        ...(canManageUsers
            ? [
                  {
                      title: 'Gerenciar Usuários',
                      href: '/users',
                      icon: Users,
                  },
              ]
            : []),
    ];

    const footerNavItems: NavItem[] = [
        // Links de rodapé (comentados por enquanto)
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <div className="flex items-center justify-between px-3 py-2 border-t border-border dark:border-zinc-700">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
                    >
                        {theme === 'dark' ? (
                            <>
                                <Sun className="h-5 w-5 text-yellow-400" />
                                Tema claro
                            </>
                        ) : (
                            <>
                                <Moon className="h-5 w-5 text-blue-500" />
                                Tema escuro
                            </>
                        )}
                    </button>
                </div>

                <NavFooter items={footerNavItems} className="mt-1" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
