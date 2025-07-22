import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type User = {
  id: number | string;
  name: string;
};

interface UserSelectProps {
  users: User[];
  selectedUserId: string;
  handleUserSelect: (userId: string) => void;
}

export function UserSelect({
  users,
  selectedUserId,
  handleUserSelect,
}: UserSelectProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Selecionar Usuário</h2>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted-foreground">Usuário</label>
        <Select onValueChange={handleUserSelect} value={selectedUserId}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Selecione um usuário" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            {users.map(user => (
              <SelectItem
                key={user.id}
                value={user.id.toString()}
                className="hover:bg-accent focus:bg-accent"
              >
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-muted rounded-lg p-4 border border-border">
        <h3 className="font-medium text-muted-foreground">Total de Usuários</h3>
        <p className="text-2xl font-bold text-primary">{users.length}</p>
      </div>
    </div>
  );
}
