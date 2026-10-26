import { useState, useEffect } from 'react';
import apiService from '../services/api.js';
import { formatarPorcentagem, formatarMedia } from '../utils/faccoes.js';
import { PERIODO_PADRAO, temFiltro, descreverPeriodo } from '../utils/periodo.js';
import SeletorPeriodo from '../components/SeletorPeriodo.jsx';
import './Faccoes.css';

// Dashboard de facções: ranking de todas as facções; cada uma abre o seu detalhe.
// O de jogadores é a tela Dashboard; os dois compartilham o período.
export default function Faccoes({ onSelecionarFaccao, periodo = PERIODO_PADRAO, onMudarPeriodo }) {
    const [faccoes, setFaccoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        // Ignora a resposta de um período que já deixou de estar selecionado
        let ignorar = false;

        const buscarFaccoes = async () => {
            try {
                setCarregando(true);
                setErro(null);
                // A lista já vem ordenada pelo backend (aproveitamento primeiro)
                const dados = await apiService.listarFaccoes(periodo);
                if (!ignorar) setFaccoes(dados);
            } catch (error) {
                if (ignorar) return;
                setFaccoes([]);
                setErro(`Erro ao carregar facções: ${error.message}`);
                console.error(error);
            } finally {
                if (!ignorar) setCarregando(false);
            }
        };

        buscarFaccoes();
        return () => { ignorar = true; };
    }, [periodo]);

    return (
        <div className="faccoes-container">
            <h1>🛡️ Dashboard de Facções</h1>

            {onMudarPeriodo && <SeletorPeriodo periodo={periodo} onMudar={onMudarPeriodo} />}

            {carregando ? (
                <div>⏳ Carregando facções...</div>
            ) : (
                <>
                    {erro && <div className="erro-mensagem">⚠️ {erro}</div>}

                    {faccoes.length > 0 && (
                        <div className="tabela-faccoes">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Posição</th>
                                        <th>Facção</th>
                                        <th>Partidas</th>
                                        <th>Vitórias</th>
                                        <th>% Vitórias</th>
                                        <th>Média de pontos</th>
                                        <th>Jogadores</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {faccoes.map((faccao, index) => (
                                        <tr key={faccao.faction}>
                                            <td className="posicao">
                                                {index === 0 && '🥇'}
                                                {index === 1 && '🥈'}
                                                {index === 2 && '🥉'}
                                                {index > 2 && `#${index + 1}`}
                                            </td>
                                            <td className="nome">
                                                <button
                                                    type="button"
                                                    className="link-faccao"
                                                    onClick={() => onSelecionarFaccao(faccao.faction)}
                                                >
                                                    {faccao.faction}
                                                </button>
                                            </td>
                                            <td className="numero">{faccao.totalGames}</td>
                                            <td className="numero">{faccao.totalVictories}</td>
                                            <td className="numero">{formatarPorcentagem(faccao.winPercentage)}</td>
                                            <td className="numero">{formatarMedia(faccao.averageScore)}</td>
                                            <td className="numero">{faccao.distinctPlayers}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!erro && faccoes.length === 0 && (
                        <div className="mensagem-vazia">
                            {temFiltro(periodo)
                                ? `Nenhuma facção jogada no período (${descreverPeriodo(periodo)}). Escolha outro período. 📅`
                                : 'Nenhuma facção jogada ainda. Registre uma partida para ver estatísticas! 🎮'}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
