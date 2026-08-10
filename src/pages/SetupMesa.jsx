import { useState, useEffect } from 'react';
import './SetupMesa.css'; // Importando nosso novo arquivo de estilos!

const USAR_API_BACKEND = false;

const JOGADORES_BD_MOCK = [
    'Aline', 'Bruno', 'Carlos', 'Daniela', 'Eduardo',
    'Fernanda', 'Gabriel', 'Hugo', 'Isabela', 'João', 'Maria'
];

export default function SetupMesa({ dadosMesa, onVoltar }) {
    const [jogadoresConfirmados, setJogadoresConfirmados] = useState([]);
    const [listaOficialJogadores, setListaOficialJogadores] = useState([]);

    const [nomeDigitado, setNomeDigitado] = useState('');
    const [sugestoes, setSugestoes] = useState([]);
    const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
    const [indiceDestacado, setIndiceDestacado] = useState(-1);

    useEffect(() => {
        if (USAR_API_BACKEND) {
            const buscarJogadoresDaAPI = async () => {
                try {
                    const response = await fetch('http://localhost:8080/api/players');
                    if (response.ok) {
                        const dados = await response.json();
                        const nomesDaAPI = dados.map(jogador => jogador.name);
                        setListaOficialJogadores(nomesDaAPI);
                    } else {
                        console.warn('⚠️ Erro na API. Usando lista estática.');
                        setListaOficialJogadores(JOGADORES_BD_MOCK);
                    }
                } catch (erro) {
                    console.error('❌ Backend inacessível. Usando lista estática.', erro);
                    setListaOficialJogadores(JOGADORES_BD_MOCK);
                }
            };
            buscarJogadoresDaAPI();
        } else {
            setListaOficialJogadores(JOGADORES_BD_MOCK);
        }
    }, []);

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

    const confirmarLista = () => {
        alert(`Temos ${jogadoresConfirmados.length} pessoa(s) confirmada(s)! Bora organizar as mesas.`);
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
                
                <p>Adicione quem vai jogar para organizarmos as mesas.</p>

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
            </div>
    );
}