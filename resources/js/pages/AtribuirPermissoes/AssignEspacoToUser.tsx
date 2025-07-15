
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  name: string;
}

interface Espaco {
  id: number;
  nome: string;
}

export default function AssignEspacoToUser() {
  const [users, setUsers] = useState<User[]>([]);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedEspacos, setSelectedEspacos] = useState<number[]>([]);
  const navigate = useNavigate();

  // Carrega os dados dos usuários e espaços ao iniciar
  useEffect(() => {
    axios.get("/api/users").then(res => setUsers(res.data));
    axios.get("/api/espacos").then(res => setEspacos(res.data));
  }, []);

  // Carrega espaços já atribuídos quando o usuário for selecionado
  useEffect(() => {
    if (selectedUser) {
      axios.get(`/api/user/${selectedUser}/espacos`)
        .then(res => {
          const ids = res.data.map((espaco: Espaco) => espaco.id);
          setSelectedEspacos(ids);
        });
    } else {
      setSelectedEspacos([]);
    }
  }, [selectedUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await axios.post("/api/espaco/sync", {
        user_id: selectedUser,
        espaco_ids: selectedEspacos
      });

      alert("Espaços atribuídos com sucesso!");
      navigate("/espacos"); // ou qualquer rota que faça sentido no seu app
    } catch (error) {
      console.error("Erro ao atribuir espaços:", error);
      alert("Erro ao atribuir espaços");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-xl font-bold mb-4">Atribuir Espaços a Usuário</h2>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block font-semibold">Usuário:</label>
          <select
            className="border rounded p-2 w-full"
            value={selectedUser ?? ""}
            onChange={(e) => setSelectedUser(Number(e.target.value))}
            required
          >
            <option value="">Selecione um usuário</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold">Espaços:</label>
          <select
            multiple
            className="border rounded p-2 w-full h-40"
            value={selectedEspacos.map(String)}
            onChange={(e) =>
              setSelectedEspacos(
                Array.from(e.target.selectedOptions, (option) => Number(option.value))
              )
            }
          >
            {espacos.map(espaco => (
              <option key={espaco.id} value={espaco.id}>
                {espaco.nome}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Salvar Atribuições
        </button>
      </form>
    </div>
  );
}
