import { useState, useEffect } from 'react';
import apiService from '../services/api.js';
import { formatarPorcentagem, formatarMedia } from '../utils/faccoes.js';
import { PERIODO_PADRAO, temFiltro, descreverPeriodo } from '../utils/periodo.js';
import SeletorPeriodo from '../components/SeletorPeriodo.jsx';
import './Faccoes.css';

export default function FaccaoDetalhe({ faccao, onVoltar, periodo = PERIODO_PADRAO, onMudarPeriodo }) {
    const [detalhe, setDetalhe] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    // Com período, o backend responde 404 para facção sem partidas nele, mesmo
    // que ela exista fora do período: não é erro, é um período vazio
    const [semPartidasNoPeriodo, setSemPartidasNoPeriodo] = useState(false);

    useEffect(() => {
        // Ignora a resposta de uma facção ou período que já deixou de estar selecionado
        let ignorar = false;

        const buscarFaccao = async () => {
            try {
                setCarregando(true);
                setErro(null);
                setSemPartidasNoPeriodo(false);
                setDetalhe(null);
                const dados = await apiService.obterFaccao(faccao, periodo);
                if (!ignorar) setDetalhe(dados);
            } catch (error) {
                if (ignorar) return;
                if (error.status === 404 && temFiltro(periodo)) {
                    setSemPartidasNoPeriodo(true);
                } else {
                    setErro(`Erro ao carregar a facção ${faccao}: ${error.message}`);
                    console.error(error);
                }
            } finally {
                if (!ignorar) setCarregando(false);
            }
        };

        buscarFaccao();
        return () => { ignorar = true; };
    }, [faccao, periodo]);

    // O backend devolve a grafia mais usada, que pode diferir da que veio da URL
    const nome = detalhe?.faction ?? faccao;
    const jogadores = detalhe?.players ?? [];

    return (
        <div className="faccoes-container">
            <button type="button" className="botao-voltar" onClick={onVoltar}>
                ← Voltar às facções
            </button>

            <h1>🛡️ {nome}</h1>

            {onMudarPeriodo && <SeletorPeriodo periodo={periodo} onMudar={onMudarPeriodo} />}

            {carregando ? (
                <div>⏳ Carregando facção...</div>
            ) : (
                <>
                    {erro && <div className="erro-mensagem">⚠️ {erro}</div>}

                    {semPartidasNoPeriodo && (
                        <div className="mensagem-vazia">
                            Nenhuma partida de {nome} no período ({descreverPeriodo(periodo)}). Escolha outro período. 📅
                        </div>
                    )}

                    {detalhe && (
                        <>
                            <div className="cards-faccao">
                                <div className="card-estatistica">
                                    <span className="card-icone">🎲</span>
                                    <span className="card-valor">{detalhe.totalGames}</span>
                                    <span className="card-rotulo">Partidas</span>
                                </div>
                                <div className="card-estatistica">
                                    <span className="card-icone">🏆</span>
                                    <span className="card-valor">{detalhe.totalVictories}</span>
                                    <span className="card-rotulo">Vitórias</span>
                                </div>
                                <div className="card-estatistica">
                                    <span className="card-icone">📈</span>
                                    <span className="card-valor">{formatarPorcentagem(detalhe.winPercentage)}</span>
                                    <span className="card-rotulo">% Vitórias</span>
                                </div>
                                <div className="card-estatistica">
                                    <span className="card-icone">⭐</span>
                                    <span className="card-valor">{formatarMedia(detalhe.averageScore)}</span>
                                    <span className="card-rotulo">Média de pontos</span>
                                </div>
                                <div className="card-estatistica">
                                    <span className="card-icone">👥</span>
                                    <span className="card-valor">{detalhe.distinctPlayers}</span>
                                    <span className="card-rotulo">Jogadores</span>
                                </div>
                            </div>

                            <h2>Desempenho por jogador</h2>

                            {jogadores.length > 0 ? (
                                <div className="tabela-faccoes">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Jogador</th>
                                                <th>Partidas</th>
                                                <th>Vitórias</th>
                                                <th>% Vitórias</th>
                                                <th>Pontos</th>
                                                <th>Média de pontos</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {jogadores.map(jogador => (
                                                <tr key={jogador.playerId}>
                                                    <td className="nome">{jogador.playerName}</td>
                                                    <td className="numero">{jogador.totalGames}</td>
                                                    <td className="numero">{jogador.totalVictories}</td>
                                                    <td className="numero">{formatarPorcentagem(jogador.winPercentage)}</td>
                                                    <td className="numero">{jogador.totalScore}</td>
                                                    <td className="numero">{formatarMedia(jogador.averageScore)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="mensagem-vazia">
                                    Nenhum jogador com esta facção.
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
