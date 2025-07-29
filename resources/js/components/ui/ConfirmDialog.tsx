import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
    open: boolean;
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    children: React.ReactNode;
    onOpenChange?: (open: boolean) => void;
}

export function ConfirmDialog({
    open,
    title = "Tem certeza?",
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    onConfirm,
    onCancel,
    children,
    onOpenChange,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>{title}</DialogTitle>
                <div className="text-sm text-gray-700">{children}</div>
                <DialogFooter>
                    <Button variant="secondary" onClick={onCancel}>
                        {cancelLabel}
                    </Button>
                    <Button variant="destructive" onClick={onConfirm}>
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

