import { useState, useEffect } from 'react';
import './App.css'
import CriarMesa from "./pages/CriarMesa.jsx";
import SetupMesa from "./pages/SetupMesa.jsx";
import Ranking from "./pages/Ranking.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RegistrarPartida from "./pages/RegistrarPartida.jsx";
import Faccoes from "./pages/Faccoes.jsx";
import FaccaoDetalhe from "./pages/FaccaoDetalhe.jsx";
import { PERIODO_PADRAO, periodoValido } from "./utils/periodo.js";

// Telas que podem ser abertas direto pela URL (#partida, #ranking...), o que
// mantém a tela atual ao dar F5. 'setup' fica de fora porque depende dos
// dados da mesa, que se perdem no reload.
const TELAS_DA_URL = ['criar', 'partida', 'ranking', 'jogadores', 'faccoes'];

// Rotas antigas que continuam funcionando em links e favoritos: #dashboard
// era o dashboard de jogadores antes de ele se separar do de facções.
const ROTAS_ANTIGAS = { dashboard: 'jogadores' };

// O detalhe de uma facção fica em #faccao/<nome>, para também sobreviver ao F5.
const PREFIXO_FACCAO = 'faccao/';

// Telas dos dashboards: compartilham o período, que vai no hash como
// "?periodo=3m" (veja utils/periodo.js). "Tudo", o padrão, fica fora da URL.
const TELAS_COM_PERIODO = ['jogadores', 'faccoes', 'faccao'];

// Parte do hash antes do "?"
const rotaDaUrl = () => window.location.hash.slice(1).split('?')[0];

const periodoDaUrl = () => {
    const consulta = window.location.hash.split('?')[1] ?? '';
    const periodo = new URLSearchParams(consulta).get('periodo');
    return periodo && periodoValido(periodo) ? periodo : PERIODO_PADRAO;
};

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
    const [tela, setTela] = useState(telaDaUrl); // 'criar', 'setup', 'partida', 'ranking', 'jogadores', 'faccoes' ou 'faccao'
    const [dadosMesa, setDadosMesa] = useState(null);
    const [faccaoSelecionada, setFaccaoSelecionada] = useState(faccaoDaUrl);
    const [periodo, setPeriodo] = useState(periodoDaUrl);

    useEffect(() => {
        const rota = tela === 'faccao'
            ? `${PREFIXO_FACCAO}${encodeURIComponent(faccaoSelecionada)}`
            : tela;
        const consulta = TELAS_COM_PERIODO.includes(tela) && periodo !== PERIODO_PADRAO
            ? `?${new URLSearchParams({ periodo })}`
            : '';
        window.history.replaceState(null, '', `#${rota}${consulta}`);
    }, [tela, faccaoSelecionada, periodo]);

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

    const irParaFaccao = (faccao) => {
        setFaccaoSelecionada(faccao);
        setTela('faccao');
    };

    const renderizarTela = () => {
        switch (tela) {
            case 'criar':
                return <CriarMesa onContinuar={irParaSetup} />;
            case 'setup':
                return <SetupMesa dadosMesa={dadosMesa} onVoltar={voltarParaCriar} />;
            case 'partida':
                return <RegistrarPartida />;
            case 'ranking':
                return <Ranking />;
            case 'faccoes':
                return <Faccoes onSelecionarFaccao={irParaFaccao} periodo={periodo} onMudarPeriodo={setPeriodo} />;
            case 'faccao':
                return <FaccaoDetalhe faccao={faccaoSelecionada} onVoltar={irParaFaccoes} periodo={periodo} onMudarPeriodo={setPeriodo} />;
            case 'jogadores':
                return <Dashboard onSelecionarFaccao={irParaFaccao} periodo={periodo} onMudarPeriodo={setPeriodo} />;
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
            </nav>

            <main>
                {renderizarTela()}
            </main>
        </div>
    )
}

export default App