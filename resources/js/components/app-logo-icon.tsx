import { cn } from '@/lib/utils';

interface AppLogoIconProps {
    className?: string;
}

export default function AppLogoIcon({ className }: AppLogoIconProps) {
    return (
        <div className={cn("flex justify-center items-center", className)}>
            <img 
                src="/logo_coruja_texto.png"
                alt="Logo SAGE claro"
                className="w-80 h-80 object-contain mb-30 block dark:hidden"
                style={{ maxWidth: 'none', maxHeight: 'none' }}
            />
            <img 
                src="/logo_coruja_texto_darkmode.png"
                alt="Logo SAGE escuro"
                className="w-80 h-80 object-contain mb-30 hidden dark:block"
                style={{ maxWidth: 'none', maxHeight: 'none' }}
            />
        </div>
    );
}
