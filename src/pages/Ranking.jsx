import React, { useState, useEffect } from 'react';
import apiService from '../services/api.js';
import './Ranking.css';

export default function Ranking() {
    const [ranking, setRanking] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        const buscarRanking = async () => {
            try {
                setCarregando(true);
                setErro(null);
                const dados = await apiService.obterRanking();
                setRanking(dados);
            } catch (error) {
                setErro(`Erro ao carregar ranking: ${error.message}`);
                console.error(error);
            } finally {
                setCarregando(false);
            }
        };

        buscarRanking();
    }, []);

    return (
        <div className="ranking-container">
            <h1>🏆 Ranking</h1>

            {carregando ? (
                <div>⏳ Carregando ranking...</div>
            ) : (
                <>
                    {erro && <div className="erro-mensagem">⚠️ {erro}</div>}

                    <div className="tabela-ranking">
                        <table>
                            <thead>
                                <tr>
                                    <th>Posição</th>
                                    <th>Jogador</th>
                                    <th>Pontos</th>
                                    <th>Partidas</th>
                                    <th>Vitórias</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ranking && ranking.length > 0 && ranking.map((jogador, index) => (
                                    <tr key={jogador.id || index} className="linha-jogador">
                                        <td className="posicao">
                                            {index === 0 && '🥇'}
                                            {index === 1 && '🥈'}
                                            {index === 2 && '🥉'}
                                            {index > 2 && `#${index + 1}`}
                                        </td>
                                        <td className="nome">{jogador.name || jogador.playerName || 'N/A'}</td>
                                        <td className="pontos">{jogador.points || jogador.score || 0}</td>
                                        <td className="partidas">{jogador.games || jogador.totalGames || 0}</td>
                                        <td className="vitorias">{jogador.wins || jogador.victories || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {(!ranking || ranking.length === 0) && (
                        <div className="mensagem-vazia">
                            Nenhum jogador no ranking ainda. Comece a jogar! 🎮
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

