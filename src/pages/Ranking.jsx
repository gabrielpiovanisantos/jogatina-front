import { useState, useEffect } from 'react';
import apiService from '../services/api.js';
import TabelaFaccoes from '../components/TabelaFaccoes.jsx';
import SeletorPeriodo from '../components/SeletorPeriodo.jsx';
import { PERIODO_PADRAO, temFiltro, descreverPeriodo, jogadoresDoPeriodo } from '../utils/periodo.js';
import './Ranking.css';

// Os dois rankings da aba: a tabela comparativa de jogadores (padrão) e a de facções
const TIPOS_RANKING = ['jogadores', 'faccoes'];
// Sem emoji, para não se confundir com as abas 👤 Jogadores e 🛡️ Facções da navbar
const ROTULOS_TIPO = { jogadores: 'Jogadores', faccoes: 'Facções' };

// O período é o mesmo dos dashboards; cada jogador abre o Dashboard de Jogadores
// e cada facção, o seu detalhe.
export default function Ranking({
    tipo = 'jogadores', onMudarTipo, onSelecionarFaccao, onSelecionarJogador,
    periodo = PERIODO_PADRAO, onMudarPeriodo
}) {
    const [ranking, setRanking] = useState([]);
    const [faccoes, setFaccoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        // Ignora a resposta de um tipo ou período que já deixou de estar selecionado
        let ignorar = false;

        const buscarRanking = async () => {
            try {
                setCarregando(true);
                setErro(null);
                if (tipo === 'faccoes') {
                    // Já vem na ordem do backend
                    const dados = await apiService.listarFaccoes(periodo);
                    if (!ignorar) setFaccoes(dados);
                } else {
                    const dados = await apiService.obterRanking(periodo);
                    if (!ignorar) setRanking(jogadoresDoPeriodo(dados, periodo));
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
    }, [tipo, periodo]);

    return (
        <div className="ranking-container">
            <h1>🏆 Ranking</h1>

            {onMudarPeriodo && <SeletorPeriodo periodo={periodo} onMudar={onMudarPeriodo} />}

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
                                    {temFiltro(periodo)
                                        ? `Nenhuma facção jogada no período (${descreverPeriodo(periodo)}). Escolha outro período. 📅`
                                        : 'Nenhuma facção no ranking ainda. Comece a jogar! 🎮'}
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
                                                <td className="nome">
                                                {onSelecionarJogador ? (
                                                    <button
                                                        type="button"
                                                        className="link-jogador"
                                                        onClick={() => onSelecionarJogador(jogador.playerId)}
                                                    >
                                                        {jogador.playerName}
                                                    </button>
                                                ) : jogador.playerName}
                                            </td>
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
                                    {temFiltro(periodo)
                                        ? `Nenhuma partida no período (${descreverPeriodo(periodo)}). Escolha outro período. 📅`
                                        : 'Nenhum jogador no ranking ainda. Comece a jogar! 🎮'}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}

