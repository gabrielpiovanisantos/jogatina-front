import { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css'
import CriarMesa from "./pages/CriarMesa.jsx";
import SetupMesa from "./pages/SetupMesa.jsx";
import Ranking from "./pages/Ranking.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RegistrarPartida from "./pages/RegistrarPartida.jsx";
import Faccoes from "./pages/Faccoes.jsx";
import FaccaoDetalhe from "./pages/FaccaoDetalhe.jsx";
import Temporadas from "./pages/Temporadas.jsx";
import apiService from "./services/api.js";
import {
    PERIODO_PADRAO, periodoValido, ehPeriodoSalvo, periodoSalvoDe, periodoSalvo, definirPeriodosSalvos, limitesDoPeriodo
} from "./utils/periodo.js";
import { PeriodosContexto } from "./utils/periodosContexto.js";

// Telas que podem ser abertas direto pela URL (#partida, #ranking...), o que
// mantém a tela atual ao dar F5. 'setup' fica de fora porque depende dos
// dados da mesa, que se perdem no reload.
const TELAS_DA_URL = ['criar', 'partida', 'ranking', 'jogadores', 'faccoes', 'temporadas'];

// Rotas antigas que continuam funcionando em links e favoritos: #dashboard
// era o dashboard de jogadores antes de ele se separar do de facções.
const ROTAS_ANTIGAS = { dashboard: 'jogadores' };

// O detalhe de uma facção fica em #faccao/<nome>, para também sobreviver ao F5.
const PREFIXO_FACCAO = 'faccao/';

// Telas dos dashboards: compartilham o período, que vai no hash como
// "?periodo=3m" (veja utils/periodo.js). "Tudo", o padrão, fica fora da URL.
const TELAS_COM_PERIODO = ['jogadores', 'faccoes', 'faccao', 'ranking'];

// Parte do hash antes do "?"
const rotaDaUrl = () => window.location.hash.slice(1).split('?')[0];

const parametroDaUrl = (nome) => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get(nome);

// Um período salvo só pode ser conferido depois que a lista chega do backend;
// se ele não existir (mais), o App troca por "Tudo".
const periodoDaUrl = () => {
    const periodo = parametroDaUrl('periodo');
    return periodo && (ehPeriodoSalvo(periodo) || periodoValido(periodo)) ? periodo : PERIODO_PADRAO;
};

// Jogador do Dashboard de Jogadores (#jogadores?jogador=<id>). Um id que não é
// número fica de fora; um que não existe cai no padrão dentro do Dashboard.
const jogadorDaUrl = () => {
    const id = parametroDaUrl('jogador');
    return id && /^\d+$/.test(id) ? id : '';
};

// O Ranking abre em jogadores; #ranking?tipo=faccoes abre o de facções
const tipoRankingDaUrl = () => (parametroDaUrl('tipo') === 'faccoes' ? 'faccoes' : 'jogadores');

const faccaoDaUrl = () => {
    const hash = rotaDaUrl();
    if (!hash.startsWith(PREFIXO_FACCAO)) return null;
    try {
        return decodeURIComponent(hash.slice(PREFIXO_FACCAO.length)) || null;
    } catch {
        return null; // hash malformado, ex.: "%E0"
    }
};

const telaDaUrl = () => {
    if (faccaoDaUrl()) return 'faccao';
    const tela = ROTAS_ANTIGAS[rotaDaUrl()] ?? rotaDaUrl();
    return TELAS_DA_URL.includes(tela) ? tela : 'criar';
};

function App() {
    const [tela, setTela] = useState(telaDaUrl); // 'criar', 'setup', 'partida', 'ranking', 'jogadores', 'faccoes', 'faccao' ou 'temporadas'
    const [dadosMesa, setDadosMesa] = useState(null);
    const [faccaoSelecionada, setFaccaoSelecionada] = useState(faccaoDaUrl);
    const [periodo, setPeriodo] = useState(periodoDaUrl);
    const [tipoRanking, setTipoRanking] = useState(tipoRankingDaUrl);
    const [jogadorSelecionado, setJogadorSelecionado] = useState(jogadorDaUrl);
    // Períodos salvos (GET /api/periods), compartilhados por todo mundo
    const [salvos, setSalvos] = useState([]);
    const [salvosCarregados, setSalvosCarregados] = useState(false);
    const [erroSalvos, setErroSalvos] = useState(null);

    const atualizarSalvos = useCallback((lista) => {
        definirPeriodosSalvos(lista); // antes do render, para utils/periodo.js resolver "salvo:<id>"
        setSalvos(lista);
    }, []);

    useEffect(() => {
        const carregarSalvos = async () => {
            try {
                atualizarSalvos(await apiService.listarPeriodosSalvos());
                setErroSalvos(null);
            } catch (error) {
                setErroSalvos(`Não foi possível carregar os períodos salvos: ${error.message}`);
            } finally {
                setSalvosCarregados(true);
            }
        };
        carregarSalvos();
    }, [atualizarSalvos]);

    // Período salvo inválido ou excluído vale como "Tudo" (e sai da URL)
    const periodoAtivo = salvosCarregados && ehPeriodoSalvo(periodo) && !periodoSalvoDe(periodo)
        ? PERIODO_PADRAO
        : periodo;

    useEffect(() => {
        const rota = tela === 'faccao'
            ? `${PREFIXO_FACCAO}${encodeURIComponent(faccaoSelecionada)}`
            : tela;
        const params = new URLSearchParams();
        if (tela === 'ranking' && tipoRanking !== 'jogadores') params.set('tipo', tipoRanking);
        if (tela === 'jogadores' && jogadorSelecionado) params.set('jogador', jogadorSelecionado);
        if (TELAS_COM_PERIODO.includes(tela) && periodoAtivo !== PERIODO_PADRAO) params.set('periodo', periodoAtivo);
        // ":" de "salvo:<id>" fica legível na URL; a leitura aceita as duas formas
        const consulta = params.toString().replace(/%3A/gi, ':');
        window.history.replaceState(null, '', `#${rota}${consulta ? `?${consulta}` : ''}`);
    }, [tela, faccaoSelecionada, periodoAtivo, tipoRanking, jogadorSelecionado]);

    const recarregarSalvos = useCallback(async () => {
        atualizarSalvos(await apiService.listarPeriodosSalvos());
    }, [atualizarSalvos]);

    const contextoPeriodos = useMemo(() => ({
        salvos,
        erro: erroSalvos,
        criarPeriodo: async (dados) => {
            const criado = await apiService.criarPeriodoSalvo(dados);
            await recarregarSalvos();
            return criado;
        },
        atualizarPeriodo: async (id, dados) => {
            const atualizado = await apiService.atualizarPeriodoSalvo(id, dados);
            await recarregarSalvos();
            return atualizado;
        },
        excluirPeriodo: async (id) => {
            await apiService.excluirPeriodoSalvo(id);
            await recarregarSalvos();
        }
    }), [salvos, erroSalvos, recarregarSalvos]);

    const irParaSetup = (dados) => {
        setDadosMesa(dados);
        setTela('setup');
    };

    const voltarParaCriar = () => {
        setTela('criar');
    };

    const irParaPartida = () => {
        setTela('partida');
    };

    const irParaRanking = () => {
        setTela('ranking');
    };

    const irParaJogadores = () => {
        setTela('jogadores');
    };

    const irParaFaccoes = () => {
        setTela('faccoes');
    };

    // Vindo do Ranking: abre o Dashboard de Jogadores já com o jogador escolhido
    const irParaJogador = (playerId) => {
        setJogadorSelecionado(String(playerId));
        setTela('jogadores');
    };

    // Da tela Temporadas: o Ranking já filtrado pela temporada
    const verRankingDaTemporada = (id) => {
        setPeriodo(periodoSalvo(id));
        setTela('ranking');
    };

    const irParaFaccao = (faccao) => {
        setFaccaoSelecionada(faccao);
        setTela('faccao');
    };

    // Com um período salvo, as telas só podem buscar depois que ele for resolvido
    const aguardandoPeriodo = TELAS_COM_PERIODO.includes(tela) && ehPeriodoSalvo(periodoAtivo) && !salvosCarregados;

    // Editar as datas do período salvo escolhido faz as telas buscarem de novo
    const { from, to } = limitesDoPeriodo(periodoAtivo);
    const chaveDoPeriodo = ehPeriodoSalvo(periodoAtivo) ? `${periodoAtivo}|${from?.toISOString()}|${to?.toISOString()}` : 'fixo';

    const renderizarTela = () => {
        if (aguardandoPeriodo) return <div className="carregando-periodo">⏳ Carregando períodos salvos...</div>;
        switch (tela) {
            case 'criar':
                return <CriarMesa onContinuar={irParaSetup} />;
            case 'setup':
                return <SetupMesa dadosMesa={dadosMesa} onVoltar={voltarParaCriar} />;
            case 'partida':
                return <RegistrarPartida />;
            case 'ranking':
                return (
                    <Ranking
                        tipo={tipoRanking}
                        onMudarTipo={setTipoRanking}
                        onSelecionarFaccao={irParaFaccao}
                        onSelecionarJogador={irParaJogador}
                        periodo={periodoAtivo}
                        onMudarPeriodo={setPeriodo}
                    />
                );
            case 'temporadas':
                return <Temporadas onVerRanking={verRankingDaTemporada} />;
            case 'faccoes':
                return <Faccoes onSelecionarFaccao={irParaFaccao} periodo={periodoAtivo} onMudarPeriodo={setPeriodo} />;
            case 'faccao':
                return <FaccaoDetalhe faccao={faccaoSelecionada} onVoltar={irParaFaccoes} periodo={periodoAtivo} onMudarPeriodo={setPeriodo} />;
            case 'jogadores':
                return (
                    <Dashboard
                        onSelecionarFaccao={irParaFaccao}
                        periodo={periodoAtivo}
                        onMudarPeriodo={setPeriodo}
                        jogadorInicial={jogadorSelecionado}
                        onMudarJogador={setJogadorSelecionado}
                    />
                );
            default:
                return <CriarMesa onContinuar={irParaSetup} />;
        }
    };

    return (
        <div className="app-container">
            <nav className="navbar">
                <button
                    className={`nav-button ${tela === 'criar' ? 'active' : ''}`}
                    onClick={() => setTela('criar')}
                >
                    🎲 Criar Mesa
                </button>
                <button
                    className={`nav-button ${tela === 'partida' ? 'active' : ''}`}
                    onClick={irParaPartida}
                >
                    📝 Registrar Partida
                </button>
                <button
                    className={`nav-button ${tela === 'ranking' ? 'active' : ''}`}
                    onClick={irParaRanking}
                >
                    🏆 Ranking
                </button>
                <button
                    className={`nav-button ${tela === 'jogadores' ? 'active' : ''}`}
                    onClick={irParaJogadores}
                >
                    👤 Jogadores
                </button>
                <button
                    className={`nav-button ${['faccoes', 'faccao'].includes(tela) ? 'active' : ''}`}
                    onClick={irParaFaccoes}
                >
                    🛡️ Facções
                </button>
                <button
                    className={`nav-button ${tela === 'temporadas' ? 'active' : ''}`}
                    onClick={() => setTela('temporadas')}
                >
                    🗓️ Nova Temporada
                </button>
            </nav>

            <PeriodosContexto.Provider value={contextoPeriodos}>
                <main key={chaveDoPeriodo}>
                    {renderizarTela()}
                </main>
            </PeriodosContexto.Provider>
        </div>
    )
}

export default App