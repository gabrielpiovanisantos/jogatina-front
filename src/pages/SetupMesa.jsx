import { useState } from 'react';
import './SetupMesa.css'; // Importando nosso novo arquivo de estilos!
import apiService from '../services/api.js';
import { MOCK_PLAYER_NAMES } from '../services/mockData.js';

export default function SetupMesa({ dadosMesa, onVoltar }) {
    const [jogadoresConfirmados, setJogadoresConfirmados] = useState([]);
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

    const adicionarJogador = (e) => {
        if (e) e.preventDefault();

        const nomeLimpo = nomeDigitado.trim();
        if (!nomeLimpo) return;

        const jaExiste = jogadoresConfirmados.find(j => j.name.toLowerCase() === nomeLimpo.toLowerCase());
        if (jaExiste) {
            alert('Esse jogador já está na lista!');
            return;
        }

        const novoJogador = { id: Date.now(), name: nomeLimpo };

        setJogadoresConfirmados([...jogadoresConfirmados, novoJogador]);
        setNomeDigitado('');
        setMostrarSugestoes(false);
        setIndiceDestacado(-1);
    };

    const removerJogador = (idParaRemover) => {
        setJogadoresConfirmados(jogadoresConfirmados.filter(j => j.id !== idParaRemover));
    };

    const [mesasOrganizadas, setMesasOrganizadas] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState(null);

    const confirmarLista = async () => {
        if (jogadoresConfirmados.length < 3) {
            alert('É necessário pelo menos 3 jogadores para organizar mesas!');
            return;
        }

        setCarregando(true);
        setErro(null);

        try {
            const dados = await apiService.organizarMesas(
                jogadoresConfirmados.map(j => ({
                    id: j.id,
                    name: j.name
                }))
            );
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

    return (
            <div className="cartao-setup">
                {onVoltar && (
                    <button onClick={onVoltar} className="btn-voltar">
                        ← Voltar
                    </button>
                )}
                
                {dadosMesa && (
                    <div className="info-mesa">
                        <p>📅 <strong>{dadosMesa.data}</strong> | 🎲 <strong>{dadosMesa.jogo}</strong> | 👥 <strong>{dadosMesa.quantidade} pessoas</strong></p>
                    </div>
                )}
                
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
                                disabled={!nomeDigitado.trim()}
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