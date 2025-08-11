import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';
import { Monitor, Moon, Sun } from 'lucide-react';
import { HTMLAttributes, useState } from 'react';

export default function AppearanceToggleDropdown({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const getCurrentIcon = () => {
        return (
            <div className="relative w-5 h-5">
                {/* Sun Icon */}
                <Sun 
                    className={`absolute inset-0 h-5 w-5 text-yellow-500 transition-all duration-1500 ease-in-out ${
                        appearance === 'light' 
                            ? 'opacity-100 rotate-0 scale-100' 
                            : 'opacity-0 rotate-180 scale-75'
                    }`}
                    style={{
                        filter: appearance === 'light' ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))' : 'none'
                    }}
                />
                {/* Moon Icon */}
                <Moon 
                    className={`absolute inset-0 h-5 w-5 text-blue-500 transition-all duration-1500 ease-in-out ${
                        appearance === 'dark' 
                            ? 'opacity-100 rotate-0 scale-100' 
                            : 'opacity-0 -rotate-180 scale-75'
                    }`}
                    style={{
                        filter: appearance === 'dark' ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' : 'none'
                    }}
                />
                {/* Monitor Icon */}
                <Monitor 
                    className={`absolute inset-0 h-5 w-5 text-gray-500 transition-all duration-1500 ease-in-out ${
                        appearance === 'system' 
                            ? 'opacity-100 rotate-0 scale-100' 
                            : 'opacity-0 rotate-90 scale-75'
                    }`}
                    style={{
                        filter: appearance === 'system' ? 'drop-shadow(0 0 8px rgba(107, 114, 128, 0.6))' : 'none'
                    }}
                />
            </div>
        );
    };

    return (
        <div className={className} {...props}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md">
                        {getCurrentIcon()}
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem 
                        onClick={() => { 
                            setHasInteracted(true);
                            setIsTransitioning(true);
                            updateAppearance('light');
                            setTimeout(() => setIsTransitioning(false), 3600);
                        }}
                        className="cursor-pointer transition-colors duration-200"
                        disabled={isTransitioning}
                    >
                        <span className="flex items-center gap-2">
                            <Sun className="h-5 w-5 text-yellow-500 transition-all duration-300 hover:rotate-12 hover:scale-110" 
                                 style={{ filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.3))' }} />
                            <span className="font-medium">
                                Light {isTransitioning && appearance !== 'light' && <span className="text-xs opacity-60">(mudando...)</span>}
                            </span>
                        </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => { 
                            setHasInteracted(true);
                            setIsTransitioning(true);
                            updateAppearance('dark');
                            setTimeout(() => setIsTransitioning(false), 3600);
                        }}
                        className="cursor-pointer transition-colors duration-200"
                        disabled={isTransitioning}
                    >
                        <span className="flex items-center gap-2">
                            <Moon className="h-5 w-5 text-blue-500 transition-all duration-300 hover:-rotate-12 hover:scale-110" 
                                  style={{ filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.3))' }} />
                            <span className="font-medium">
                                Dark {isTransitioning && appearance !== 'dark' && <span className="text-xs opacity-60">(mudando...)</span>}
                            </span>
                        </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => { 
                            setHasInteracted(true);
                            setIsTransitioning(true);
                            updateAppearance('system');
                            setTimeout(() => setIsTransitioning(false), 3600);
                        }}
                        className="cursor-pointer transition-colors duration-200"
                        disabled={isTransitioning}
                    >
                        <span className="flex items-center gap-2">
                            <Monitor className="h-5 w-5 text-gray-500 transition-all duration-300 hover:scale-110" 
                                     style={{ filter: 'drop-shadow(0 0 4px rgba(107, 114, 128, 0.3))' }} />
                            <span className="font-medium">
                                System {isTransitioning && appearance !== 'system' && <span className="text-xs opacity-60">(mudando...)</span>}
                            </span>
                        </span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
