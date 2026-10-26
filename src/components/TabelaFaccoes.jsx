import { formatarPorcentagem, formatarMedia } from '../utils/faccoes.js';
import '../pages/Faccoes.css';

// Tabela comparativa das facções, na ordem em que o backend as manda.
// Usada pelo Dashboard de Facções e pelo Ranking; cada nome abre o detalhe.
export default function TabelaFaccoes({ faccoes, onSelecionarFaccao }) {
    return (
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
    );
}
