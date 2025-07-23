import { useEffect } from 'react';
import { useToast } from './use-toast';

export function useToastDismissOnClick() {
  const { dismissAll, toasts } = useToast();

  useEffect(() => {
    // Só adiciona o listener se houver toasts ativos
    if (toasts.length === 0) return;

    const handleButtonClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Verifica se o clique foi em um botão ou dentro de um botão
      const isButton = target.tagName === 'BUTTON' || 
                      target.closest('button') !== null ||
                      target.getAttribute('role') === 'button' ||
                      target.closest('[role="button"]') !== null;

      // Verifica se o clique não foi no próprio toast ou seus elementos
      const isToastElement = target.closest('[data-radix-toast-viewport]') !== null ||
                            target.closest('[data-radix-toast]') !== null ||
                            target.hasAttribute('toast-close');

      // Se foi um clique em botão e não foi no toast, dismissar todos os toasts
      if (isButton && !isToastElement) {
        dismissAll();
      }
    };

    // Adiciona o listener
    document.addEventListener('click', handleButtonClick, true);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleButtonClick, true);
    };
  }, [dismissAll, toasts.length]);
}