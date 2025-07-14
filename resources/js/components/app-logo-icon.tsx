

export default function AppLogoIcon() {
    return (
        <>
            <div className="flex items-center">
                <img 
                    src="/coruja_maior.png"
                    alt="Logo SAGE" 
                    className="w-24 h-24 object-contain"
                    width={96}
                    height={96}
                />
                <div className="ml-2 grid flex-1 text-left text-sm">
                    <span className="mb-0.5 truncate leading-tight font-semibold">SAGE</span>
                </div>
            </div>
        </>
    );
}
