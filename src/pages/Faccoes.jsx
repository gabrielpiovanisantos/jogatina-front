import { useState, useEffect } from 'react';
import apiService from '../services/api.js';
import { formatarPorcentagem, formatarMedia } from '../utils/faccoes.js';
import './Faccoes.css';

export default function Faccoes({ onSelecionarFaccao, onVoltar }) {
    const [faccoes, setFaccoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        const buscarFaccoes = async () => {
            try {
                setCarregando(true);
                setErro(null);
                // A lista já vem ordenada pelo backend (aproveitamento primeiro)
                const dados = await apiService.listarFaccoes();
                setFaccoes(dados);
            } catch (error) {
                setErro(`Erro ao carregar facções: ${error.message}`);
                console.error(error);
            } finally {
                setCarregando(false);
            }
        };

        buscarFaccoes();
    }, []);

    return (
        <div className="faccoes-container">
            <button type="button" className="botao-voltar" onClick={onVoltar}>
                ← Voltar ao dashboard
            </button>

            <h1>🛡️ Facções</h1>

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
                            Nenhuma facção jogada ainda. Registre uma partida para ver estatísticas! 🎮
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
