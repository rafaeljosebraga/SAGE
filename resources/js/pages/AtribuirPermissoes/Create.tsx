
// components/AssignEspacoToUser.tsx

import { useEffect, useState } from "react";
import axios from "axios";

export default function AssignEspacoToUser() {
  const [users, setUsers] = useState([]);
  const [espacos, setEspacos] = useState([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedEspacos, setSelectedEspacos] = useState<number[]>([]);

  useEffect(() => {
    axios.get("/api/users").then(res => setUsers(res.data));
    axios.get("/api/espacos").then(res => setEspacos(res.data));
  }, []);

  const handleSubmit = async () => {
    if (selectedUser) {
      await axios.post("/api/espaco/sync", {
        user_id: selectedUser,
        espaco_ids: selectedEspacos,
      });

      alert("Espaços atribuídos com sucesso!");
    }
  };

  return (
    <div>
      <h2>Atribuir Espaços a Usuário</h2>

      <label>Usuário</label>
      <select onChange={e => setSelectedUser(Number(e.target.value))}>
        <option value="">Selecione um usuário</option>
        {users.map((user: any) => (
          <option key={user.id} value={user.id}>{user.name}</option>
        ))}
      </select>

      <label>Espaços</label>
      <select
        multiple
        onChange={e =>
          setSelectedEspacos(
            Array.from(e.target.selectedOptions).map(opt => Number(opt.value))
          )
        }
      >
        {espacos.map((espaco: any) => (
          <option key={espaco.id} value={espaco.id}>{espaco.nome}</option>
        ))}
      </select>

      <button onClick={handleSubmit}>Salvar</button>
    </div>
  );
}
