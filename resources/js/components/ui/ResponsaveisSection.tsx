import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/user-avatar';
import React from 'react';

interface ResponsaveisSectionProps {
  createdBy?: User;
  users?: User[];
}

export function ResponsaveisSection({ createdBy, users = [] }: ResponsaveisSectionProps) {
    const formatPerfil = (perfil: string | undefined) => {
        if (!perfil) return "Não definido";
        return perfil.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    const getPerfilColor = (perfil: string | undefined) => {
        if (!perfil) return "bg-gray-100 text-gray-800 border-gray-200";

        switch (perfil.toLowerCase()) {
            case "administrador":
                return "bg-[#EF7D4C] text-white border-transparent";
            case "coordenador":
                return "bg-[#957157] text-white border-transparent";
            case "diretor_geral":
                return "bg-[#F1DEC5] text-gray-600 border-transparent";
            case "servidores":
                return "bg-[#285355] text-white border-transparent";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };
  const responsaveis: Array<User & { tipo: string }> = [];

  if (createdBy) {
    responsaveis.push({ ...createdBy, tipo: 'Criador' });
  }

  users.forEach((user) => {
    if (!responsaveis.find((r) => r.id === user.id)) {
      responsaveis.push({ ...user, tipo: 'Com Permissão' });
    }
  });

  return (
    <div id="responsaveis-section" className="bg-muted/30 p-4 rounded-lg border border-border">
      <label className="text-sm font-medium text-muted-foreground">Responsáveis</label>

      {responsaveis.length > 0 ? (
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {responsaveis.map((responsavel) => (
            <div key={responsavel.id} className="bg-background/50 p-3 rounded-md border border-border">
              <div className="flex items-start gap-2">
                <UserAvatar user={responsavel} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-card-foreground break-words">{responsavel.name}</p>
                    <Badge variant="outline" className="text-xs self-start">{responsavel.tipo}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground break-words mt-1">{responsavel.email}</p>
                </div>
              </div>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerfilColor(
                    responsavel.perfil_acesso
                  )}`}
                >
                  {formatPerfil(responsavel.perfil_acesso)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-lg text-card-foreground mt-1">Não definido</p>
      )}
    </div>
  );
}
