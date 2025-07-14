export default function AppLogo() {
    return (
        <>
            <div className="flex items-center">
                <img 
                    src="/coruja.png"
                    alt="Logo SAGE" 
                    className="w-8 h-8 object-contain"
                    width={32}
                    height={32}
                />
                <div className="ml-2 grid flex-1 text-left text-sm">
                    <span className="mb-0.5 truncate leading-tight font-semibold">SAGE</span>
                </div>
            </div>
        </>
    );
}
