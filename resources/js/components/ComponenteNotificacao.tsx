
import React, { useState, useEffect } from 'react';

const ComponenteNotificacao = ({ ComponenteAcao, idUsuario }) => {
    const [notificacoes, setNotificacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    // Buscar notificações do usuário
    const buscarNotificacoes = async () => {
        try {
            const resposta = await fetch(`/api/notificacoes/usuario/${idUsuario}`);
            const dados = await resposta.json();
            setNotificacoes(dados);
            setCarregando(false);
        } catch (err) {
            setErro('Falha ao carregar notificações');
            setCarregando(false);
        }
    };

    useEffect(() => {
        buscarNotificacoes();
    }, [idUsuario]);

    const marcarComoLida = async (id) => {
        try {
            await fetch(`/api/notificacoes/marcar-como-lida/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            setNotificacoes(notificacoes.map(notif =>
                notif.id === id ? {...notif, lida: true} : notif
            ));
        } catch (err) {
            setErro('Falha ao marcar notificação como lida');
        }
    };

    const excluirNotificacao = async (id) => {
        try {
            await fetch(`/api/notificacoes/excluir/${id}`, {
                method: 'DELETE',
            });
            setNotificacoes(notificacoes.filter(notif => notif.id !== id));
        } catch (err) {
            setErro('Falha ao excluir notificação');
        }
    };

    if (carregando) return <div>Carregando notificações...</div>;
    if (erro) return <div>{erro}</div>;

    return (
        <div>
            <h2>Suas Notificações</h2>

            {notificacoes.length === 0 ? (
                <p>Nenhuma notificação para exibir</p>
            ) : (
                <div>
                    {notificacoes.map(notificacao => (
                        <div key={notificacao.id}>
                            <div>
                                <h3>{notificacao.titulo}</h3>
                                <span>
                                    {new Date(notificacao.created_at).toLocaleString('pt-BR')}
                                </span>
                            </div>
                            <p>{notificacao.mensagem}</p>

                            <div>
                                {!notificacao.lida && (
                                    <button onClick={() => marcarComoLida(notificacao.id)}>
                                        Marcar como Lida
                                    </button>
                                )}
                                <button onClick={() => excluirNotificacao(notificacao.id)}>
                                    Excluir
                                </button>

                                {/* Espaço para o componente personalizado */}
                                {ComponenteAcao && (
                                    <div>
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
};

// Exemplo de componente personalizado que pode ser passado como prop
export const ComponenteAcaoExemplo = ({ notificacao }) => {
    return (
        <button>
            Ação Personalizada para #{notificacao.id}
        </button>
    );
};

export default ComponenteNotificacao;
