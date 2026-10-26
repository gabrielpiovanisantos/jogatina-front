import { useState, useEffect } from 'react';
import apiService from '../services/api.js';
import './RegistrarPartida.css';
import { paraAAAAMMDD, formatarDataBR, intervaloDoDia, dataComHoraAtual } from '../utils/datas.js';

// Nomes do manual brasileiro "As Leis de Root". São gravados como estão no
// backend, que agrupa as partidas por esse texto.
const FACCOES_ROOT = [
    'Marqueses',
    'Dinastia das Rapinas',
    'Aliança da Floresta',
    'Malandro',
    'Lagartos Cultistas',
    'Companhia Ribeirinha',
    'Ducado Subterrâneo',
    'Conspiração Corvídea',
    'Senhor das Centenas',
    'Guardiões de Ferro'
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

    // Dia da partida (AAAA-MM-DD) e o número dela entre as partidas desse dia
    const [dataPartida, setDataPartida] = useState(() => paraAAAAMMDD(new Date()));
    const [numeroPartida, setNumeroPartida] = useState(null);
    const [partidasSalvas, setPartidasSalvas] = useState(0);

    useEffect(() => {
        if (!dataPartida) return;
        let cancelado = false;

        const buscarNumero = async () => {
            try {
                const { inicio, fim } = intervaloDoDia(dataPartida);
                const partidasDoDia = await apiService.listarPartidas(inicio, fim);
                if (!cancelado) setNumeroPartida(partidasDoDia.length + 1);
            } catch (error) {
                if (!cancelado) setNumeroPartida(null);
                console.error(error);
            }
        };

        buscarNumero();
        // Evita que a resposta de uma data antiga sobrescreva a da data atual
        return () => { cancelado = true; };
    }, [dataPartida, partidasSalvas]);

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
            dateTime: dataComHoraAtual(dataPartida).toISOString(),
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
            // Reseta o formulário após o sucesso e avança a numeração do dia
            setResultados([{ playerId: '', faction: '', points: 0, won: false }]);
            setPartidasSalvas(n => n + 1);
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
            <h2>
                {numeroPartida && dataPartida ? `Partida ${numeroPartida}` : 'Partida'}
                {dataPartida && ` · ${formatarDataBR(dataPartida)}`}
            </h2>

            <form onSubmit={salvarPartida}>
                <div className="campo-data">
                    <label htmlFor="data-partida">Data da partida:</label>
                    <input
                        id="data-partida"
                        type="date"
                        required
                        max={paraAAAAMMDD(new Date())}
                        value={dataPartida}
                        onChange={(e) => setDataPartida(e.target.value)}
                    />
                </div>

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