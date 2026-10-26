import { useState, useEffect } from 'react';
import apiService from '../services/api.js';
import { formatarPorcentagem, formatarMedia } from '../utils/faccoes.js';
import { PERIODO_PADRAO, temFiltro, descreverPeriodo } from '../utils/periodo.js';
import SeletorPeriodo from '../components/SeletorPeriodo.jsx';
import './Dashboard.css';
import './Faccoes.css';

// Dashboard de jogadores: um jogador por vez, com cards e as facções que ele jogou.
// O de facções é a tela Faccoes; os dois compartilham o período.
export default function Dashboard({ onSelecionarFaccao, periodo = PERIODO_PADRAO, onMudarPeriodo }) {
    const [jogadores, setJogadores] = useState([]);
    const [jogadorSelecionadoId, setJogadorSelecionadoId] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    // Facções do jogador selecionado, vindas de GET /dashboard/ranking/{playerId}
    const [faccoesJogador, setFaccoesJogador] = useState([]);
    const [carregandoFaccoes, setCarregandoFaccoes] = useState(false);
    const [erroFaccoes, setErroFaccoes] = useState(null);

    useEffect(() => {
        // Ignora a resposta de um período que já deixou de estar selecionado
        let ignorar = false;

        const buscarJogadores = async () => {
            try {
                setCarregando(true);
                setErro(null);
                const dados = await apiService.obterRanking(periodo);
                if (ignorar) return;
                // Com período, o backend lista todo mundo e zera quem não jogou nele: escondemos esses
                const visiveis = temFiltro(periodo) ? dados.filter(j => j.totalGames > 0) : dados;
                setJogadores(visiveis);
                // Mantém o jogador escolhido se ele continua na lista
                setJogadorSelecionadoId(atual =>
                    visiveis.some(j => String(j.playerId) === atual)
                        ? atual
                        : (visiveis.length > 0 ? String(visiveis[0].playerId) : '')
                );
            } catch (error) {
                if (ignorar) return;
                setJogadores([]);
                setErro(`Erro ao carregar jogadores: ${error.message}`);
                console.error(error);
            } finally {
                if (!ignorar) setCarregando(false);
            }
        };

        buscarJogadores();
        return () => { ignorar = true; };
    }, [periodo]);

    useEffect(() => {
        if (!jogadorSelecionadoId) return;
        // Ignora a resposta de um jogador que já deixou de estar selecionado
        let ignorar = false;

        const buscarFaccoesJogador = async () => {
            try {
                setCarregandoFaccoes(true);
                setErroFaccoes(null);
                setFaccoesJogador([]);
                const dados = await apiService.obterRankingJogador(jogadorSelecionadoId, periodo);
                if (!ignorar) setFaccoesJogador(dados?.factions ?? []);
            } catch (error) {
                if (!ignorar) setErroFaccoes(`Erro ao carregar facções do jogador: ${error.message}`);
                console.error(error);
            } finally {
                if (!ignorar) setCarregandoFaccoes(false);
            }
        };

        buscarFaccoesJogador();
        return () => { ignorar = true; };
    }, [jogadorSelecionadoId, periodo]);

    const faccoesVencedoras = faccoesJogador.filter(f => f.totalVictories > 0);

    const jogadorSelecionado = jogadores.find(
        j => String(j.playerId) === jogadorSelecionadoId
    );

    return (
        <div className="dashboard-container">
            <h1>👤 Dashboard de Jogadores</h1>

            {onMudarPeriodo && <SeletorPeriodo periodo={periodo} onMudar={onMudarPeriodo} />}

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

                    {jogadorSelecionado && (
                        <section className="faccoes-jogador">
                            <h2>🛡️ Facções jogadas</h2>

                            {carregandoFaccoes && <div>⏳ Carregando facções do jogador...</div>}

                            {erroFaccoes && <div className="erro-mensagem">⚠️ {erroFaccoes}</div>}

                            {!carregandoFaccoes && !erroFaccoes && faccoesJogador.length === 0 && (
                                <div className="mensagem-vazia">Este jogador ainda não tem facções registradas.</div>
                            )}

                            {!carregandoFaccoes && faccoesJogador.length > 0 && (
                                <>
                                    <p className="resumo-vitorias">
                                        {faccoesVencedoras.length > 0
                                            ? `🏆 Venceu com: ${faccoesVencedoras.map(f => f.faction).join(', ')}`
                                            : 'Ainda sem vitórias com nenhuma facção.'}
                                    </p>

                                    <div className="tabela-faccoes">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Facção</th>
                                                    <th>Partidas</th>
                                                    <th>Vitórias</th>
                                                    <th>% Vitórias</th>
                                                    <th>Média de pontos</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {faccoesJogador.map(f => (
                                                    <tr
                                                        key={f.faction}
                                                        className={f.totalVictories > 0 ? 'faccao-vencedora' : undefined}
                                                    >
                                                        <td className="nome">
                                                            {f.totalVictories > 0 && <span aria-label="venceu">🏆 </span>}
                                                            {onSelecionarFaccao ? (
                                                                <button
                                                                    type="button"
                                                                    className="link-faccao"
                                                                    onClick={() => onSelecionarFaccao(f.faction)}
                                                                >
                                                                    {f.faction}
                                                                </button>
                                                            ) : f.faction}
                                                        </td>
                                                        <td className="numero">{f.totalGames}</td>
                                                        <td className="numero">{f.totalVictories}</td>
                                                        <td className="numero">{formatarPorcentagem(f.winPercentage)}</td>
                                                        <td className="numero">{formatarMedia(f.averageScore)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </section>
                    )}

                    {!erro && jogadores.length === 0 && (
                        <div className="mensagem-vazia">
                            {temFiltro(periodo)
                                ? `Nenhuma partida no período (${descreverPeriodo(periodo)}). Escolha outro período. 📅`
                                : 'Nenhum jogador encontrado. Registre uma partida para ver estatísticas! 🎮'}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
