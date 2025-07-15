import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Edit2, Trash2, Save, XCircle } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Foto {
    id?: number;
    url: string;
    nome_original: string;
    descricao?: string;
    ordem: number;
}

interface PhotoUploadProps {
    espacoId?: number;
    fotos?: Foto[];
    onFotosChange?: (fotos: Foto[]) => void;
    maxFiles?: number;
    maxFileSize?: number; // em MB
    className?: string;
}

export function PhotoUpload({ 
    espacoId, 
    fotos = [], 
    onFotosChange, 
    maxFiles = 10, 
    maxFileSize = 5,
    className = ""
}: PhotoUploadProps) {
    const [fotosLocal, setFotosLocal] = useState<Foto[]>(fotos);
    const [uploading, setUploading] = useState(false);
    const [editingFoto, setEditingFoto] = useState<number | null>(null);
    const [editDescricao, setEditDescricao] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        
        if (files.length === 0) return;
        
        // Validar número máximo de arquivos
        if (fotosLocal.length + files.length > maxFiles) {
            alert(`Máximo de ${maxFiles} fotos permitidas`);
            return;
        }

        // Validar tamanho dos arquivos
        const maxSizeBytes = maxFileSize * 1024 * 1024;
        const invalidFiles = files.filter(file => file.size > maxSizeBytes);
        if (invalidFiles.length > 0) {
            alert(`Alguns arquivos excedem o tamanho máximo de ${maxFileSize}MB`);
            return;
        }

        // Se temos um espacoId, fazer upload direto
        if (espacoId) {
            await uploadFotos(files);
        } else {
            // Caso contrário, apenas adicionar à lista local para preview
            const novasFotos: Foto[] = files.map((file, index) => ({
                url: URL.createObjectURL(file),
                nome_original: file.name,
                ordem: fotosLocal.length + index
            }));
            
            const fotosAtualizadas = [...fotosLocal, ...novasFotos];
            setFotosLocal(fotosAtualizadas);
            onFotosChange?.(fotosAtualizadas);
        }

        // Limpar input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadFotos = async (files: File[]) => {
        if (!espacoId) return;

        setUploading(true);
        
        const formData = new FormData();
        formData.append('espaco_id', espacoId.toString());
        
        files.forEach((file, index) => {
            formData.append(`fotos[${index}]`, file);
        });

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const response = await fetch('/fotos', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });

            if (response.ok) {
                const result = await response.json();
                const fotosAtualizadas = [...fotosLocal, ...result.fotos];
                setFotosLocal(fotosAtualizadas);
                onFotosChange?.(fotosAtualizadas);
            } else {
                const errorText = await response.text();
                console.error('Erro na resposta:', response.status, errorText);
                alert(`Erro ao fazer upload das fotos: ${response.status} - ${response.statusText}`);
            }
        } catch (error) {
            console.error('Erro no upload:', error);
            alert('Erro ao fazer upload das fotos');
        } finally {
            setUploading(false);
        }
    };

    const removerFoto = async (index: number) => {
        const foto = fotosLocal[index];
        
        if (foto.id && espacoId) {
            // Remover do servidor
            try {
                const response = await fetch(`/fotos/${foto.id}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                });

                if (!response.ok) {
                    alert('Erro ao remover foto');
                    return;
                }
            } catch (error) {
                console.error('Erro ao remover foto:', error);
                alert('Erro ao remover foto');
                return;
            }
        }

        // Remover da lista local
        const fotosAtualizadas = fotosLocal.filter((_, i) => i !== index);
        setFotosLocal(fotosAtualizadas);
        onFotosChange?.(fotosAtualizadas);
    };

    const editarDescricao = async (foto: Foto, novaDescricao: string) => {
        if (!foto.id || !espacoId) return;

        try {
            const response = await fetch(`/fotos/${foto.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    descricao: novaDescricao,
                }),
            });

            if (response.ok) {
                const fotosAtualizadas = fotosLocal.map(f => 
                    f.id === foto.id ? { ...f, descricao: novaDescricao } : f
                );
                setFotosLocal(fotosAtualizadas);
                onFotosChange?.(fotosAtualizadas);
                setEditingFoto(null);
            } else {
                alert('Erro ao atualizar descrição');
            }
        } catch (error) {
            console.error('Erro ao atualizar descrição:', error);
            alert('Erro ao atualizar descrição');
        }
    };

    const iniciarEdicao = (foto: Foto, index: number) => {
        setEditingFoto(foto.id || index);
        setEditDescricao(foto.descricao || '');
    };

    const cancelarEdicao = () => {
        setEditingFoto(null);
        setEditDescricao('');
    };

    return (
        <Card className={`border-border bg-card ${className}`}>
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Fotos do Espaço
                    <span className="text-sm font-normal text-muted-foreground">
                        ({fotosLocal.length} de {maxFiles})
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Área de Upload */}
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/40 transition-colors bg-muted/20 dark:bg-muted/10">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                    />
                    
                    <div className="space-y-4">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium text-foreground">
                                Adicionar Fotos
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Clique no botão abaixo ou arraste arquivos para esta área
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading || fotosLocal.length >= maxFiles}
                            className="min-w-[200px]"
                        >
                            {uploading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Selecionar Fotos
                                </>
                            )}
                        </Button>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>Máximo {maxFiles} fotos • Até {maxFileSize}MB cada</p>
                            <p>Formatos aceitos: JPG, PNG, GIF</p>
                        </div>
                    </div>
                </div>

                {/* Grid de Fotos */}
                {fotosLocal.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-foreground">
                                Fotos Adicionadas
                            </h3>
                            <span className="text-sm text-muted-foreground">
                                {fotosLocal.length} foto{fotosLocal.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {fotosLocal.map((foto, index) => (
                                <Card key={foto.id || index} className="overflow-hidden border-border bg-card">
                                    <div className="relative group">
                                        <img
                                            src={foto.url}
                                            alt={foto.nome_original}
                                            className="w-full h-48 object-cover"
                                        />
                                        
                                        {/* Overlay com ações */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="flex space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => iniciarEdicao(foto, index)}
                                                    className="bg-background/90 hover:bg-background text-foreground shadow-lg"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => removerFoto(index)}
                                                    className="shadow-lg"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <CardContent className="p-4">
                                        {editingFoto === (foto.id || index) ? (
                                            <div className="space-y-3">
                                                <div>
                                                    <Label htmlFor={`desc-${index}`} className="text-sm font-medium text-foreground">
                                                        Descrição da foto
                                                    </Label>
                                                    <Input
                                                        id={`desc-${index}`}
                                                        value={editDescricao}
                                                        onChange={(e) => setEditDescricao(e.target.value)}
                                                        placeholder="Digite uma descrição..."
                                                        className="mt-1"
                                                    />
                                                </div>
                                                {/* Botões movidos para baixo do input */}
                                                <div className="flex space-x-2 pt-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => editarDescricao(foto, editDescricao)}
                                                        className="flex-1 bg-primary hover:bg-primary/90"
                                                    >
                                                        <Save className="h-3 w-3 mr-1" />
                                                        Salvar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={cancelarEdicao}
                                                        className="flex-1"
                                                    >
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Cancelar
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {foto.nome_original}
                                                </p>
                                                {/* Caixa para a descrição */}
                                                <div className="border border-border rounded-md p-3 bg-muted/30 min-h-[60px] flex items-center">
                                                    {foto.descricao ? (
                                                        <p className="text-sm text-foreground">
                                                            {foto.descricao}
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground italic">
                                                            Sem descrição
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Estado vazio */}
                {fotosLocal.length === 0 && (
                    <div className="text-center py-8">
                        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-2 text-sm font-medium text-foreground">
                            Nenhuma foto adicionada
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Comece adicionando algumas fotos do espaço
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}