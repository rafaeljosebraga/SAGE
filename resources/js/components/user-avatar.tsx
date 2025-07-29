import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback, useMemo } from 'react';

interface UserAvatarProps {
    user: User;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function UserAvatar({ user, className, size = 'md' }: UserAvatarProps) {
    const getInitials = useInitials();
    const [cacheTimestamp, setCacheTimestamp] = useState(() => 
        user.updated_at ? new Date(user.updated_at).getTime() : Date.now()
    );
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8', 
        lg: 'h-12 w-12'
    };

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };

    // Memoizar as iniciais para evitar recálculos desnecessários
    const initials = useMemo(() => getInitials(user.name), [getInitials, user.name]);

    // Escutar evento de atualização de foto de perfil
    useEffect(() => {
        const handleProfilePhotoUpdate = (event: CustomEvent) => {
            if (event.detail.userId === user.id) {
                setCacheTimestamp(event.detail.timestamp);
            }
        };

        window.addEventListener('profile-photo-updated', handleProfilePhotoUpdate as EventListener);
        
        return () => {
            window.removeEventListener('profile-photo-updated', handleProfilePhotoUpdate as EventListener);
        };
    }, [user.id]);

    // Memoizar a URL da foto para evitar recálculos desnecessários
    const profilePhotoUrl = useMemo(() => {
        if (user.profile_photo) {
            return `/storage/${user.profile_photo}?v=${cacheTimestamp}`;
        }
        return user.avatar;
    }, [user.profile_photo, user.avatar, cacheTimestamp]);

    return (
        <div className={cn(sizeClasses[size], 'rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0', className)}>
            {profilePhotoUrl ? (
                <img 
                    src={profilePhotoUrl} 
                    alt={user.name}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span className={cn(
                    'text-slate-700 dark:text-slate-200 font-medium',
                    textSizeClasses[size]
                )}>
                    {initials}
                </span>
            )}
        </div>
    );
}