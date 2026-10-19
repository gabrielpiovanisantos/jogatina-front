import { useState, useEffect } from 'react';
import apiService from '../services/api.js';
import './RegistrarPartida.css';

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
    // Jogadores cadastrados no backend (cadastrados ao organizar mesas)
    const [jogadores, setJogadores] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        const buscarJogadores = async () => {
            try {
                setCarregando(true);
                setErro(null);
                setJogadores(await apiService.listarJogadores());
            } catch (error) {
                setErro(`Erro ao carregar jogadores: ${error.message}`);
                console.error(error);
            } finally {
                setCarregando(false);
            }
        };

        buscarJogadores();
    }, []);

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

    if (carregando) {
        return <div className="cartao-partida">⏳ Carregando jogadores...</div>;
    }

    if (erro) {
        return <div className="cartao-partida"><div className="erro-mensagem">⚠️ {erro}</div></div>;
    }

    if (jogadores.length === 0) {
        return <div className="cartao-partida">Nenhum jogador cadastrado ainda. Organize uma mesa para cadastrar os jogadores.</div>;
    }

    return (
        <div className="cartao-partida">
            <h2>Nova Partida</h2>

            <form onSubmit={salvarPartida}>
                {resultados.map((resultado, index) => (
                    <div key={index} className="resultado-jogador">
                        <h3>Jogador {index + 1}</h3>

                        <div className="linha-selects">
                            <select
                                required
                                aria-label={`Jogador ${index + 1}`}
                                value={resultado.playerId}
                                onChange={(e) => atualizarCampo(index, 'playerId', e.target.value)}
                            >
                                <option value="">Selecione o Jogador</option>
                                {/* Quem já foi escolhido em outra linha fica desabilitado: o backend recusa jogador repetido */}
                                {jogadores.map(j => (
                                    <option
                                        key={j.id}
                                        value={j.id}
                                        disabled={resultados.some((r, i) => i !== index && String(r.playerId) === String(j.id))}
                                    >
                                        {j.name}
                                    </option>
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

                        <div className="linha-pontuacao">
                            <label>
                                Pontos:
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="30"
                                    value={resultado.points}
                                    onChange={(e) => atualizarCampo(index, 'points', e.target.value)}
                                />
                            </label>

                            <label className="campo-vencedor">
                                <input
                                    type="checkbox"
                                    checked={resultado.won}
                                    onChange={(e) => atualizarCampo(index, 'won', e.target.checked)}
                                />
                                Vencedor?
                            </label>

                            {resultados.length > 1 && (
                                <button type="button" className="btn-remover" onClick={() => removerJogador(index)}>
                                    Remover
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                <div className="acoes-partida">
                    <button type="button" className="btn-adicionar" onClick={adicionarJogador}>
                        + Adicionar Jogador
                    </button>

                    <button type="submit" className="btn-salvar">
                        Salvar Partida
                    </button>
                </div>
            </form>
        </div>
    );
}