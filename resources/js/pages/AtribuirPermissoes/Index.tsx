import { Link, usePage } from '@inertiajs/react';

export default function Index() {
  const { users, espacos } = usePage().props as {
    users: { id: number; name: string }[];
    espacos: { id: number; nome: string }[];
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Atribuições de Espaços</h1>
      <Link href="/espaco-user/create" className="bg-blue-600 text-white px-4 py-2 rounded">
        Nova Atribuição
      </Link>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Usuários</h2>
        <ul>
          {users.map(user => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>

        <h2 className="text-lg font-semibold mt-4">Espaços</h2>
        <ul>
          {espacos.map(e => (
            <li key={e.id}>{e.nome}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
