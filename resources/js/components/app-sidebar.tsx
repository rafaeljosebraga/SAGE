import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useCanManageUsers, useIsDiretorGeral, useAuth } from '@/hooks/use-auth';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Users, Building, MapPin, Package, BookUser, Calendar, Settings } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const canManageUsers = useCanManageUsers();
    const isDiretorGeral = useIsDiretorGeral();
    const auth = useAuth();
    
    // Verificar se o usuário NÃO é administrador (mostrar agendamentos para todos exceto administradores)
    const canViewAgendamentos = auth?.user?.perfil_acesso !== 'administrador';

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
        ...(canViewAgendamentos
            ? [
                  {
                      title: 'Agendamentos',
                      href: '/agendamentos',
                      icon: Calendar,
                  },
              ]
            : []),
        ...(canManageUsers
            ? [
                  {
                      title: 'Gerenciar Usuários',
                      href: '/usuarios',
                      icon: Users,
                  },
              ]
            : []),
        ...(isDiretorGeral
            ? [
                  {
                      title: 'Gerenciar Agendamentos',
                      href: '/gerenciar-agendamentos',
                      icon: Settings,
                  },
                  {
                      title: 'Espaços',
                      href: '/espacos',
                      icon: Building,
                  },
                  {
                      title: 'Localizações',
                      href: '/localizacoes',
                      icon: MapPin,
                  },
                  {
                      title: 'Recursos',
                      href: '/recursos',
                      icon: Package,
                  },
                  {
                      title: 'Atribuir Permissões',
                      href: '/atribuir-permissoes',
                      icon: BookUser,
                  },
              ]
            : []),
    ];

    const footerNavItems: NavItem[] = [
       /* {
            title: 'Repository',
            href: 'https://github.com/laravel/react-starter-kit',
            icon: Folder,
        },
        {
            title: 'Documentation',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: BookOpen,
        },*/
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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}