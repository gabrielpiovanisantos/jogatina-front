import { useState, useEffect, useRef, useCallback } from 'react';
import './SetupMesa.css'; // Importando nosso novo arquivo de estilos!
import apiService from '../services/api.js';
import { MOCK_PLAYER_NAMES } from '../services/mockData.js';
import { formatarDataBR } from '../utils/datas.js';

// De quanto em quanto tempo a tela busca a mesa de novo, para ver os nomes
// que outras pessoas adicionaram pelo link compartilhado.
export const INTERVALO_ATUALIZACAO_MS = 3000;

const linkDaMesa = (mesaId) =>
    `${window.location.origin}${window.location.pathname}#setup/${encodeURIComponent(mesaId)}`;

export default function SetupMesa({ mesaId, onVoltar }) {
    // Mesa do backend: { id, date, game, expectedPlayers, players: [{ id, name }] }
    const [mesa, setMesa] = useState(null);
    const [naoEncontrada, setNaoEncontrada] = useState(false);
    const [erroCarregar, setErroCarregar] = useState(null);
    const [linkCopiado, setLinkCopiado] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const jogadoresConfirmados = mesa?.players ?? [];

    // Cada mesa recebida (busca periódica ou resposta de uma alteração) ganha um
    // número; uma busca que começou antes de outra resposta chegar está velha e
    // é descartada, para não "desfazer" na tela um nome recém-adicionado.
    const versao = useRef(0);

    const aplicarMesa = useCallback((novaMesa) => {
        versao.current += 1;
        setMesa(novaMesa);
        setErroCarregar(null);
    }, []);

    const buscarMesa = useCallback(async () => {
        const versaoNoInicio = versao.current;
        try {
            const atual = await apiService.obterMesa(mesaId);
            if (versao.current === versaoNoInicio) aplicarMesa(atual);
        } catch (error) {
            if (error.status === 404) setNaoEncontrada(true);
            else setErroCarregar(`Não foi possível atualizar a mesa: ${error.message}`);
        }
    }, [mesaId, aplicarMesa]);

    useEffect(() => {
        const carregar = async () => { await buscarMesa(); };
        carregar();
        const intervalo = setInterval(() => {
            if (!document.hidden) buscarMesa();
        }, INTERVALO_ATUALIZACAO_MS);
        return () => clearInterval(intervalo);
    }, [buscarMesa]);

    const copiarLink = async () => {
        try {
            await navigator.clipboard.writeText(linkDaMesa(mesaId));
            setLinkCopiado(true);
            setTimeout(() => setLinkCopiado(false), 2000);
        } catch {
            // Sem acesso à área de transferência (http, permissão): o link está no campo para copiar à mão
            setLinkCopiado(false);
        }
    };
    // Sempre usar lista mock para autocomplete (não há endpoint específico)
    // O backend será chamado apenas quando organizar as mesas
    const listaOficialJogadores = MOCK_PLAYER_NAMES;

    const [nomeDigitado, setNomeDigitado] = useState('');
    const [sugestoes, setSugestoes] = useState([]);
    const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
    const [indiceDestacado, setIndiceDestacado] = useState(-1);

    const lidarComDigitacao = (e) => {
        const valor = e.target.value;
        setNomeDigitado(valor);
        setIndiceDestacado(-1);

        if (valor.trim().length > 0) {
            const filtrados = listaOficialJogadores.filter(nomeBuscado =>
                nomeBuscado.toLowerCase().includes(valor.toLowerCase())
            );
            setSugestoes(filtrados);
            setMostrarSugestoes(true);
        } else {
            setMostrarSugestoes(false);
        }
    };

    const selecionarSugestao = (nomeSugerido) => {
        setNomeDigitado(nomeSugerido);
        setMostrarSugestoes(false);
        setIndiceDestacado(-1);
    };

    const lidarComTeclado = (e) => {
        if (!mostrarSugestoes || sugestoes.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIndiceDestacado((prev) => (prev < sugestoes.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIndiceDestacado((prev) => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter' && indiceDestacado >= 0) {
            e.preventDefault();
            selecionarSugestao(sugestoes[indiceDestacado]);
        } else if (e.key === 'Escape') {
            setMostrarSugestoes(false);
            setIndiceDestacado(-1);
        }
    };

    const [mesasOrganizadas, setMesasOrganizadas] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState(null);

    const adicionarJogador = async (e) => {
        if (e) e.preventDefault();

        const nomeLimpo = nomeDigitado.trim();
        if (!nomeLimpo || enviando) return;

        const jaExiste = jogadoresConfirmados.find(j => j.name.toLowerCase() === nomeLimpo.toLowerCase());
        if (jaExiste) {
            alert('Esse jogador já está na lista!');
            return;
        }

        setEnviando(true);
        setErro(null);
        try {
            aplicarMesa(await apiService.adicionarJogadorNaMesa(mesaId, nomeLimpo));
            setNomeDigitado('');
            setMostrarSugestoes(false);
            setIndiceDestacado(-1);
        } catch (error) {
            // Ex.: outra pessoa adicionou o mesmo nome um instante antes
            setErro(error.message);
            buscarMesa();
        } finally {
            setEnviando(false);
        }
    };

    const removerJogador = async (idParaRemover) => {
        setErro(null);
        try {
            aplicarMesa(await apiService.removerJogadorDaMesa(mesaId, idParaRemover));
        } catch (error) {
            setErro(error.message);
        }
    };

    const confirmarLista = async () => {
        if (jogadoresConfirmados.length < 3) {
            alert('É necessário pelo menos 3 jogadores para organizar mesas!');
            return;
        }

        setCarregando(true);
        setErro(null);

        try {
            const dados = await apiService.organizarMesaCompartilhada(mesaId);
            setMesasOrganizadas(dados.groups);
        } catch (error) {
            setErro(`⚠️ Falha ao conectar com o servidor: ${error.message}`);
            console.error(error);
        } finally {
            setCarregando(false);
        }
    };

    const voltarParaLista = () => {
        setMesasOrganizadas(null);
        setErro(null);
    };

    if (naoEncontrada) {
        return (
            <div className="cartao-setup">
                <h2>Mesa não encontrada</h2>
                <p>O link pode estar errado ou incompleto. Peça o link de novo a quem criou a mesa.</p>
                {onVoltar && (
                    <button onClick={onVoltar} className="btn-voltar">
                        ← Criar uma mesa
                    </button>
                )}
            </div>
        );
    }

    if (!mesa) {
        return (
            <div className="cartao-setup">
                {erroCarregar ? <p role="alert">⚠️ {erroCarregar}</p> : <p>⏳ Carregando mesa...</p>}
            </div>
        );
    }

    return (
            <div className="cartao-setup">
                {onVoltar && (
                    <button onClick={onVoltar} className="btn-voltar">
                        ← Voltar
                    </button>
                )}

                <div className="info-mesa">
                    <p>📅 <strong>{formatarDataBR(mesa.date)}</strong> | 🎲 <strong>{mesa.game}</strong> | 👥 <strong>{mesa.expectedPlayers} pessoas</strong></p>
                </div>

                <div className="compartilhar-mesa">
                    <label htmlFor="link-mesa">Envie este link para os outros colocarem o nome:</label>
                    <div className="compartilhar-linha">
                        <input
                            id="link-mesa"
                            type="text"
                            readOnly
                            value={linkDaMesa(mesaId)}
                            onFocus={(e) => e.target.select()}
                        />
                        <button type="button" onClick={copiarLink} className="btn-copiar-link">
                            {linkCopiado ? '✓ Copiado' : '📋 Copiar link'}
                        </button>
                    </div>
                </div>

                {erroCarregar && <div className="aviso-atualizacao" role="status">⚠️ {erroCarregar}</div>}
                
                {!mesasOrganizadas ? (
                    <>
                        <p>Adicione quem vai jogar para organizarmos as mesas.</p>

                        {erro && <div style={{ color: 'red', marginBottom: '20px' }}>⚠️ {erro}</div>}

                        <form onSubmit={adicionarJogador} className="formulario-linha">
                            <div className="input-container">
                                <input
                                    type="text"
                                    placeholder="Nome do jogador..."
                                    className="input-nome"
                                    value={nomeDigitado}
                                    onChange={lidarComDigitacao}
                                    onKeyDown={lidarComTeclado}
                                    onBlur={() => setTimeout(() => {
                                        setMostrarSugestoes(false);
                                        setIndiceDestacado(-1);
                                    }, 150)}
                                    onFocus={() => { if (nomeDigitado) setMostrarSugestoes(true) }}
                                />

                                {mostrarSugestoes && sugestoes.length > 0 && (
                                    <ul className="lista-sugestoes">
                                        {sugestoes.map((sugestao, index) => (
                                            <li
                                                key={index}
                                                className="item-sugestao"
                                                onMouseDown={() => selecionarSugestao(sugestao)}
                                                style={{ backgroundColor: index === indiceDestacado ? '#e0f7fa' : 'white' }}
                                                onMouseEnter={() => setIndiceDestacado(index)}
                                                onMouseLeave={() => setIndiceDestacado(-1)}
                                            >
                                                {sugestao}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn-adicionar"
                                disabled={!nomeDigitado.trim() || enviando}
                            >
                                +
                            </button>
                        </form>

                        <div className="painel-totais">
                            <h4>Total de confirmados: {jogadoresConfirmados.length}</h4>
                        </div>

                        <ul className="lista-jogadores">
                            {jogadoresConfirmados.map(jogador => (
                                <li key={jogador.id} className="item-jogador">
                                    <span>{jogador.name}</span>
                                    <button onClick={() => removerJogador(jogador.id)} className="btn-remover">
                                        Remover
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={confirmarLista}
                                disabled={jogadoresConfirmados.length < 3 || carregando}
                                style={{
                                    backgroundColor: jogadoresConfirmados.length < 3 ? '#ccc' : '#4CAF50',
                                    color: 'white',
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: jogadoresConfirmados.length < 3 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {carregando ? '⏳ Organizando...' : '✓ Organizar Mesas'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2>Mesas Organizadas 🎲</h2>
                        {erro && <div style={{ color: 'red', marginBottom: '20px' }}>⚠️ {erro}</div>}
                        
                        <div style={{ marginBottom: '20px' }}>
                            {mesasOrganizadas.map((mesa, indexMesa) => (
                                <div
                                    key={indexMesa}
                                    style={{
                                        border: '2px solid #2196F3',
                                        borderRadius: '8px',
                                        padding: '15px',
                                        marginBottom: '15px',
                                        backgroundColor: '#f0f8ff'
                                    }}
                                >
                                    <h3 style={{ marginTop: 0 }}>🎮 Mesa {indexMesa + 1} ({mesa.length} jogadores)</h3>
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {mesa.map((jogador, indexJogador) => (
                                            <li
                                                key={indexJogador}
                                                style={{
                                                    padding: '8px 12px',
                                                    backgroundColor: '#fff',
                                                    marginBottom: '5px',
                                                    borderRadius: '4px',
                                                    borderLeft: '4px solid #2196F3'
                                                }}
                                            >
                                                {jogador.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                            <button
                                onClick={voltarParaLista}
                                style={{
                                    backgroundColor: '#ff9800',
                                    color: 'white',
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                ← Reorganizar
                            </button>
                        </div>
                    </>
                )}
            </div>
    );
}
