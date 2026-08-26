import { useState } from 'react';
import apiService from '../services/api.js';
import { MOCK_PLAYERS } from '../services/mockData.js';

const FACCOES_ROOT = [
    'Marquise de Cat',
    'Eyrie Dynasties',
    'Woodland Alliance',
    'Vagabond',
    'Lizard Cult',
    'Riverfolk Company',
    'Underground Duchy',
    'Corvid Conspiracy'
];

export default function RegistrarPartida() {
    // Estado que guarda a lista de resultados preenchidos na tela
    const [resultados, setResultados] = useState([
        { playerId: '', faction: '', points: 0, won: false }
    ]);

    // Função para adicionar um novo formulário de jogador na tela
    const adicionarJogador = () => {
        setResultados([...resultados, { playerId: '', faction: '', points: 0, won: false }]);
    };

    // Função para atualizar um campo específico de um jogador
    const atualizarCampo = (index, campo, valor) => {
        const novosResultados = [...resultados];
        novosResultados[index][campo] = valor;
        setResultados(novosResultados);
    };

    // Função para remover um jogador da lista
    const removerJogador = (index) => {
        const novosResultados = resultados.filter((_, i) => i !== index);
        setResultados(novosResultados);
    };

    // Função que envia o JSON para o Spring Boot
    const salvarPartida = async (e) => {
        e.preventDefault(); // Evita que a página recarregue

        // Formata os dados para garantir que os tipos estejam corretos para o Kotlin
        const payload = {
            dateTime: new Date().toISOString(),
            results: resultados.map(r => ({
                playerId: parseInt(r.playerId),
                faction: String(r.faction),
                points: parseInt(r.points),
                won: Boolean(r.won)
            }))
        };

        try {
            await apiService.registrarPartida(payload);
            alert('🏆 Partida registrada com sucesso!');
            // Reseta o formulário após o sucesso
            setResultados([{ playerId: '', faction: '', points: 0, won: false }]);
        } catch (error) {
            alert(`⚠️ Falha ao registrar partida: ${error.message}`);
            console.error(error);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h2>Nova Partida</h2>

            <form onSubmit={salvarPartida}>
                {resultados.map((resultado, index) => (
                    <div key={index} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
                        <h3>Jogador {index + 1}</h3>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <select
                                required
                                value={resultado.playerId}
                                onChange={(e) => atualizarCampo(index, 'playerId', e.target.value)}
                            >
                                <option value="">Selecione o Jogador</option>
                                {MOCK_PLAYERS.map(j => (
                                    <option key={j.id} value={j.id}>{j.name}</option>
                                ))}
                            </select>

                            <select
                                required
                                value={resultado.faction}
                                onChange={(e) => atualizarCampo(index, 'faction', e.target.value)}
                            >
                                <option value="">Selecione a Facção</option>
                                {FACCOES_ROOT.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <label>
                                Pontos:
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="30"
                                    value={resultado.points}
                                    onChange={(e) => atualizarCampo(index, 'points', e.target.value)}
                                    style={{ width: '60px', marginLeft: '5px' }}
                                />
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <input
                                    type="checkbox"
                                    checked={resultado.won}
                                    onChange={(e) => atualizarCampo(index, 'won', e.target.checked)}
                                />
                                Vencedor?
                            </label>

                            {resultados.length > 1 && (
                                <button type="button" onClick={() => removerJogador(index)} style={{ color: 'red', marginLeft: 'auto' }}>
                                    Remover
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    <button type="button" onClick={adicionarJogador}>
                        + Adicionar Jogador
                    </button>

                    <button type="submit" style={{ backgroundColor: '#4CAF50', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Salvar Partida
                    </button>
                </div>
            </form>
        </div>
    );
}