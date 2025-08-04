import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Moon, Sun } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
    const [hasInteracted, setHasInteracted] = useState(false);

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

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
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
        </header>
    );
}
