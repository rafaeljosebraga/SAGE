import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploadProps {
    value?: File[];
    onChange?: (files: File[]) => void;
    maxFiles?: number;
    maxFileSize?: number; // em MB
    acceptedTypes?: string[];
    className?: string;
    label?: string;
    description?: string;
    error?: string;
    disabled?: boolean;
}

export function PhotoUpload({
    value = [],
    onChange,
    maxFiles = 10,
    maxFileSize = 5, // 5MB por padrão
    acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    className,
    label = 'Fotos',
    description = 'Arraste e solte as fotos aqui ou clique para selecionar',
    error,
    disabled = false,
}: PhotoUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Gerar previews quando os arquivos mudarem
    React.useEffect(() => {
        const newPreviews: string[] = [];
        
        value.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    newPreviews.push(e.target.result as string);
                    if (newPreviews.length === value.length) {
                        setPreviews([...newPreviews]);
                    }
                }
            };
            reader.readAsDataURL(file);
        });

        if (value.length === 0) {
            setPreviews([]);
        }
    }, [value]);

    const validateFile = (file: File): string | null => {
        if (!acceptedTypes.includes(file.type)) {
            return `Tipo de arquivo não suportado. Use: ${acceptedTypes.join(', ')}`;
        }
        
        if (file.size > maxFileSize * 1024 * 1024) {
            return `Arquivo muito grande. Máximo: ${maxFileSize}MB`;
        }
        
        return null;
    };

    const handleFiles = useCallback((files: FileList) => {
        const newFiles: File[] = [];
        const errors: string[] = [];

        Array.from(files).forEach((file) => {
            const error = validateFile(file);
            if (error) {
                errors.push(`${file.name}: ${error}`);
            } else if (value.length + newFiles.length < maxFiles) {
                newFiles.push(file);
            } else {
                errors.push(`Máximo de ${maxFiles} arquivos permitido`);
            }
        });

        if (errors.length > 0) {
            console.warn('Erros no upload:', errors);
            // Aqui você pode mostrar os erros para o usuário
        }

        if (newFiles.length > 0) {
            onChange?.([...value, ...newFiles]);
        }
    }, [value, onChange, maxFiles, maxFileSize, acceptedTypes]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (disabled) return;
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    }, [handleFiles, disabled]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (disabled) return;
        
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    }, [handleFiles, disabled]);

    const removeFile = useCallback((index: number) => {
        if (disabled) return;
        
        const newFiles = value.filter((_, i) => i !== index);
        onChange?.(newFiles);
    }, [value, onChange, disabled]);

    const openFileDialog = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className={cn('space-y-4', className)}>
            {label && (
                <div className="space-y-1">
                    <Label>{label}</Label>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
            )}

            {/* Área de Upload */}
            <Card 
                className={cn(
                    'border-2 border-dashed transition-colors cursor-pointer',
                    dragActive && 'border-primary bg-primary/5',
                    error && 'border-destructive',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={openFileDialog}
            >
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-2">
                        Clique para selecionar ou arraste as fotos aqui
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Máximo {maxFiles} fotos • Até {maxFileSize}MB cada • JPG, PNG, WebP
                    </p>
                </CardContent>
            </Card>

            {/* Input oculto */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedTypes.join(',')}
                onChange={handleChange}
                className="hidden"
                disabled={disabled}
            />

            {/* Erro */}
            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            {/* Preview das fotos */}
            {value.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-sm font-medium">
                        Fotos selecionadas ({value.length}/{maxFiles})
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {previews.map((preview, index) => (
                            <Card key={index} className="relative group overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="aspect-square relative">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        {!disabled && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFile(index);
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="p-2">
                                        <p className="text-xs text-muted-foreground truncate">
                                            {value[index]?.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {(value[index]?.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Informações adicionais */}
            {value.length === 0 && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    Nenhuma foto selecionada
                </div>
            )}
        </div>
    );
}