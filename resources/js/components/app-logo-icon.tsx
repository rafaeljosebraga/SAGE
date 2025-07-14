export default function AppLogoIcon() {
    return (
        <div className="flex items-center">
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

            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">SAGE</span>
            </div>
        </div>
    );
}
