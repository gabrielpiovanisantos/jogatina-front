import { useState, useEffect } from 'react';
import apiService from '../services/api.js';
import './Dashboard.css';

export default function Dashboard({ onVerFaccoes }) {
    const [jogadores, setJogadores] = useState([]);
    const [jogadorSelecionadoId, setJogadorSelecionadoId] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        const buscarJogadores = async () => {
            try {
                setCarregando(true);
                setErro(null);
                const dados = await apiService.obterRanking();
                setJogadores(dados);
                if (dados && dados.length > 0) {
                    setJogadorSelecionadoId(String(dados[0].playerId));
                }
            } catch (error) {
                setErro(`Erro ao carregar jogadores: ${error.message}`);
                console.error(error);
            } finally {
                setCarregando(false);
            }
        };

        buscarJogadores();
    }, []);

    const jogadorSelecionado = jogadores.find(
        j => String(j.playerId) === jogadorSelecionadoId
    );

    return (
        <div className="dashboard-container">
            <h1>📊 Dashboard</h1>

            {onVerFaccoes && (
                <div className="atalhos-dashboard">
                    <button type="button" className="botao-faccoes" onClick={onVerFaccoes}>
                        🛡️ Ver desempenho das facções
                    </button>
                </div>
            )}

            {carregando ? (
                <div>⏳ Carregando dashboard...</div>
            ) : (
                <>
                    {erro && <div className="erro-mensagem">⚠️ {erro}</div>}

                    {jogadores.length > 0 && (
                        <div className="seletor-jogador">
                            <label htmlFor="seletor-jogador">Jogador:</label>
                            <select
                                id="seletor-jogador"
                                value={jogadorSelecionadoId}
                                onChange={(e) => setJogadorSelecionadoId(e.target.value)}
                            >
                                {jogadores.map(j => (
                                    <option key={j.playerId} value={j.playerId}>
                                        {j.playerName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {jogadorSelecionado && (
                        <div className="cards-estatisticas">
                            <div className="card-estatistica">
                                <span className="card-icone">🎲</span>
                                <span className="card-valor">{jogadorSelecionado.totalGames}</span>
                                <span className="card-rotulo">Partidas Jogadas</span>
                            </div>

                            <div className="card-estatistica">
                                <span className="card-icone">🛡️</span>
                                <span className="card-valor">{jogadorSelecionado.differentFactions}</span>
                                <span className="card-rotulo">Facções Diferentes</span>
                            </div>

                            <div className="card-estatistica">
                                <span className="card-icone">🏆</span>
                                <span className="card-valor">{jogadorSelecionado.totalVictories}</span>
                                <span className="card-rotulo">Vitórias</span>
                            </div>
                        </div>
                    )}

                    {jogadores.length === 0 && (
                        <div className="mensagem-vazia">
                            Nenhum jogador encontrado. Registre uma partida para ver estatísticas! 🎮
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
