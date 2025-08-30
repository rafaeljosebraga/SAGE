// components/NotificationsModal.jsx
import { useEffect, useRef } from 'react';

export function NotificationsModal({ isOpen, onClose, notifications}) {
    const modalRef = useRef(null);

    // Fechar o modal ao clicar fora dele
    useEffect(() => {
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Formatar a data para exibição
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffTime / (1000 * 60));

        if (diffDays > 0) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
        if (diffHours > 0) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        if (diffMinutes > 0) return `Há ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
        return 'Agora mesmo';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-4">
            <div
                ref={modalRef}
                className="bg-background border rounded-lg shadow-lg w-80 max-h-96 overflow-y-auto"
            >
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Notificações</h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-2">
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-3 hover:bg-accent cursor-pointer transition-colors border-b last:border-b-0 ${notification.lida ? 'opacity-70' : 'bg-accent/20'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-medium">{notification.titulo}</p>
                                    {!notification.lida && (
                                        <span className="h-2 w-2 rounded-full bg-blue-500 ml-2 mt-1"></span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{notification.mensagem}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(notification.created_at)}
                                    </p>
                                    <div className="flex space-x-2">
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-muted-foreground">
                            Nenhuma notificação no momento.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
