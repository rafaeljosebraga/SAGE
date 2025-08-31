import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
import ComponenteNotificacao, { ComponenteAcaoExemplo } from '@/components/ComponenteNotificacao';
import { router } from '@inertiajs/react';
import { useState } from 'react';

export default function NotificaIndexMalucoIndex() {
    const { notificacoes } = usePage().props;

    const handleReload = () => {
        router.reload({ only: ['notificacoes'] });
    };
const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
// Estado para o formulário
    const [data, setData] = useState({
        id: '',
        titulo: '',
        mensagem: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!data.id) {
            setMessage('Por favor, informe um ID de usuário.');
            setMessageType('error');
            return;
        }

        setData({ id: '', titulo: '', mensagem: '' });
        //Route::post('/notificacoes/user/{user_id}', [notificacaoController::class, 'notificaUser']);
        // Pelo comrpo a gente passa o titulo e a mensagem
        return router.post(`/notificacoes/user/${data.id}`, {titulo: data.titulo, mensagem: data.mensagem});
    };

    const handleSubmitEspaco = (e) => {
        e.preventDefault();

        if (!data.id) {
            setMessage('Por favor, informe um ID de usuário.');
            setMessageType('error');
            return;
        }

        setData({ id: '', titulo: '', mensagem: '' });
        //Route::post('/notificacoes/user/{user_id}', [notificacaoController::class, 'notificaUser']);
        // Pelo comrpo a gente passa o titulo e a mensagem
        return router.post(`/notificacoes/espaco/${data.id}/managers`, {titulo: data.titulo, mensagem: data.mensagem});
    };
    return (
        <AppLayout>
            <div className="space-y-6">
                <ComponenteNotificacao
                    componenteAcao={ComponenteAcaoExemplo}
                    notificacoes={notificacoes}
                    onReload={handleReload}
                />
            </div>
            <div className="p-6 bg-white shadow-xl rounded-2xl w-full">
                    <h1 className="text-3xl font-extrabold mb-4 text-gray-900">Testar Notificação</h1>
                    <h2 className="text-lg font-semibold mb-6 text-gray-600">Enviar Notificação (Simulado)</h2>

                    {message && (
                        <div className={`p-4 mb-4 rounded-lg text-sm font-medium ${messageType === 'success' ? 'bg-green-100 text-green-800' : messageType === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                            {message}
                        </div>
                    )}

                    <form className="space-y-4">
                        <div>
                            <label htmlFor="id" className="block text-sm font-medium text-gray-700">
                                ID do Usuário:
                            </label>
                            <input
                                id="id"
                                type="number"
                                name="id"
                                value={data.id}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
                                placeholder="Ex: 1 para o Diretor João"
                            />
                        </div>
                        <div>
                            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">
                                Título:
                            </label>
                            <input
                                id="titulo"
                                type="text"
                                name="titulo"
                                value={data.titulo}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
                                placeholder="Insira o título da notificação"
                            />
                        </div>
                        <div>
                            <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700">
                                Mensagem:
                            </label>
                            <textarea
                                id="mensagem"
                                name="mensagem"
                                value={data.mensagem}
                                onChange={handleChange}
                                required
                                rows="3"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
                                placeholder="Escreva a mensagem aqui"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                            onClick={handleSubmit}
                        >
                            Enviar Notificação
                        </button>
                        <button
                            type="submit"
                            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                            onClick={handleSubmitEspaco}
                        >
                            Enviar Notificação Para espaço
                        </button>
                    </form>
                </div>
        </AppLayout>
    );
}
