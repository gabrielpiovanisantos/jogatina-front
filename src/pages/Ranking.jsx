import { useState, useEffect } from 'react';
import apiService from '../services/api.js';
import TabelaFaccoes from '../components/TabelaFaccoes.jsx';
import './Ranking.css';

// Os dois rankings da aba: a tabela comparativa de jogadores (padrão) e a de facções
const TIPOS_RANKING = ['jogadores', 'faccoes'];
// Sem emoji, para não se confundir com as abas 👤 Jogadores e 🛡️ Facções da navbar
const ROTULOS_TIPO = { jogadores: 'Jogadores', faccoes: 'Facções' };

export default function Ranking({ tipo = 'jogadores', onMudarTipo, onSelecionarFaccao }) {
    const [ranking, setRanking] = useState([]);
    const [faccoes, setFaccoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        // Ignora a resposta de um tipo que já deixou de estar selecionado
        let ignorar = false;

        const buscarRanking = async () => {
            try {
                setCarregando(true);
                setErro(null);
                if (tipo === 'faccoes') {
                    // Já vem na ordem do backend; o Ranking não filtra por período
                    const dados = await apiService.listarFaccoes();
                    if (!ignorar) setFaccoes(dados);
                } else {
                    const dados = await apiService.obterRanking();
                    if (!ignorar) setRanking(dados);
                }
            } catch (error) {
                if (ignorar) return;
                setErro(tipo === 'faccoes'
                    ? `Erro ao carregar ranking de facções: ${error.message}`
                    : `Erro ao carregar ranking: ${error.message}`);
                console.error(error);
            } finally {
                if (!ignorar) setCarregando(false);
            }
        };

        buscarRanking();
        return () => { ignorar = true; };
    }, [tipo]);

    return (
        <div className="ranking-container">
            <h1>🏆 Ranking</h1>

            {onMudarTipo && (
                <div className="seletor-tipo-ranking" role="group" aria-label="Tipo de ranking">
                    {TIPOS_RANKING.map(t => (
                        <button
                            key={t}
                            type="button"
                            className={t === tipo ? 'ativo' : undefined}
                            aria-pressed={t === tipo}
                            onClick={() => onMudarTipo(t)}
                        >
                            {ROTULOS_TIPO[t]}
                        </button>
                    ))}
                </div>
            )}

            {carregando ? (
                <div>⏳ Carregando ranking...</div>
            ) : (
                <>
                    {erro && <div className="erro-mensagem">⚠️ {erro}</div>}

                    {tipo === 'faccoes' ? (
                        <>
                            {faccoes.length > 0 && (
                                <TabelaFaccoes faccoes={faccoes} onSelecionarFaccao={onSelecionarFaccao} />
                            )}

                            {!erro && faccoes.length === 0 && (
                                <div className="mensagem-vazia">
                                    Nenhuma facção no ranking ainda. Comece a jogar! 🎮
                                </div>
                            )}
                        </>
                    ) : (
                        <>
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
                                            <tr key={jogador.playerId} className="linha-jogador">
                                                <td className="posicao">
                                                    {index === 0 && '🥇'}
                                                    {index === 1 && '🥈'}
                                                    {index === 2 && '🥉'}
                                                    {index > 2 && `#${index + 1}`}
                                                </td>
                                                <td className="nome">{jogador.playerName}</td>
                                                <td className="pontos">{jogador.totalScore}</td>
                                                <td className="partidas">{jogador.totalGames}</td>
                                                <td className="vitorias">{jogador.totalVictories}</td>
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
                </>
            )}
        </div>
    );
}

