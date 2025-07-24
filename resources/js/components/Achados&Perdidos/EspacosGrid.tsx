type Espaco = {
  id: number | string;
  nome: string;
};

interface EspacosGridProps {
  espacos: Espaco[];
}

export function EspacosGrid({ espacos }: EspacosGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {espacos.map(espaco => (
        <div
          key={espaco.id}
          className="border border-border rounded-lg p-4 bg-background hover:bg-accent transition-colors"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-foreground">{espaco.nome}</h3>
            <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
              Ativo
            </span>
          </div>
          <div className="mt-3 flex items-center text-sm text-muted-foreground">
            <span className="bg-primary/10 text-primary rounded px-2 py-1 mr-2">
              ID: {espaco.id}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
