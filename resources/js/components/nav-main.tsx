import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { router } from '@inertiajs/react';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useUnsavedChanges } from '@/contexts/unsaved-changes-context';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { hasUnsavedChanges } = useUnsavedChanges();
    const { setHasUnsavedChanges } = useUnsavedChanges();
    const page = usePage();

    const [showModal, setShowModal] = useState(false);
    const [pendingHref, setPendingHref] = useState<string | null>(null);

    const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            setPendingHref(href);
            setShowModal(true);
        }
    };
    const confirmNavigation = () => {
        if (pendingHref) {
            router.visit(pendingHref);
            setShowModal(false);
            setHasUnsavedChanges(false); // Reset unsaved changes state

            setPendingHref(null);
        }
    };

    const cancelNavigation = () => {
        setShowModal(false);
        setPendingHref(null);
    };

return (
        <>
            <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel>Menu</SidebarGroupLabel>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={page.url.startsWith(item.href)}
                                tooltip={{ children: item.title }}
                            >
                                <Link
                                    href={item.href}
                                    prefetch
                                    onClick={(e) => handleNavigation(e, item.href)}
                                >
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>

            {/* Modal customizado */}
            <ConfirmDialog
                open={showModal}
                onCancel={cancelNavigation}
                onConfirm={confirmNavigation}
            >
                Você tem alterações não salvas. Deseja sair mesmo assim?
            </ConfirmDialog>
        </>
    );
}
