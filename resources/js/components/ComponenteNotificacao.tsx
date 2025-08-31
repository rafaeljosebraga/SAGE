import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

const ComponenteNotificacao = ({ComponenteAcao,notificacoes,onReload}) => {
    const [erro, setErro] = useState(null);


    const marcarComoLida = (id) => {
        router.put(`/notificacoes/${id}/read`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                if (onReload) onReload();}
        });
    };

    const excluirNotificacao = (id) => {
        router.delete(`/notificacoes/${id}`, {
            preserveScroll: true,
            onSuccess: () => {
                // pede para o pai recarregar
                if (onReload) {
                    onReload();}
            }
        });
    };



    if (erro) return <div>{erro}</div>;

return (
  <div className="w-full max-w-3xl mx-auto p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Suas Notificações</h2>

    {notificacoes.length === 0 ? (
      <p className="text-gray-500 text-center">Nenhuma notificação para exibir</p>
    ) : (
      <div className="space-y-4">
        {notificacoes.map((notificacao) => (
          <div
            key={notificacao.id}
            className="bg-white shadow-md rounded-2xl border border-gray-200 overflow-hidden"
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {notificacao.titulo}
              </h3>
              <span className="text-sm text-gray-500">
                {new Date(notificacao.created_at).toLocaleString("pt-BR")}
              </span>
            </div>

            {/* Corpo */}
            <div className="px-4 py-3">
              <p className="text-gray-700 leading-relaxed">
                {notificacao.mensagem}
              </p>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-200">
              {!notificacao.lida && (
                <button
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
                  onClick={() => marcarComoLida(notificacao.id)}
                >
                  Marcar como Lida
                </button>
              )}
              <button
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                onClick={() => excluirNotificacao(notificacao.id)}
              >
                Excluir
              </button>

              {ComponenteAcao && (
                <div className="ml-auto">
                  <ComponenteAcao notificacao={notificacao} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

}
// Exemplo de componente personalizado que pode ser passado como prop
export const ComponenteAcaoExemplo = ({ notificacao }) => {
    return (
        <button>
            Ação Personalizada para #{notificacao.id}
        </button>
    );
};

export default ComponenteNotificacao;
