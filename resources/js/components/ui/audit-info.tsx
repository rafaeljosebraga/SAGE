import { type User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Calendar, User as UserIcon } from 'lucide-react';

interface AuditInfoProps {
    createdBy?: User;
    updatedBy?: User;
    createdAt: string;
    updatedAt: string;
    className?: string;
}

export function AuditInfo({ 
    createdBy, 
    updatedBy, 
    createdAt, 
    updatedAt, 
    className = '' 
}: AuditInfoProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={`space-y-2 text-xs text-muted-foreground ${className}`}>
            <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>Criado em: {formatDate(createdAt)}</span>
                {createdBy && (
                    <>
                        <span>por</span>
                        <Badge variant="outline" className="text-xs">
                            <UserIcon className="h-3 w-3 mr-1" />
                            {createdBy.name}
                        </Badge>
                    </>
                )}
            </div>
            
            {updatedAt !== createdAt && (
                <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Atualizado em: {formatDate(updatedAt)}</span>
                    {updatedBy && (
                        <>
                            <span>por</span>
                            <Badge variant="outline" className="text-xs">
                                <UserIcon className="h-3 w-3 mr-1" />
                                {updatedBy.name}
                            </Badge>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}