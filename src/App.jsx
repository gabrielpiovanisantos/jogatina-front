import { useState, useEffect } from 'react';
import './App.css'
import CriarMesa from "./pages/CriarMesa.jsx";
import SetupMesa from "./pages/SetupMesa.jsx";
import Ranking from "./pages/Ranking.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RegistrarPartida from "./pages/RegistrarPartida.jsx";
import Faccoes from "./pages/Faccoes.jsx";
import FaccaoDetalhe from "./pages/FaccaoDetalhe.jsx";

// Telas que podem ser abertas direto pela URL (#partida, #ranking...), o que
// mantém a tela atual ao dar F5. 'setup' fica de fora porque depende dos
// dados da mesa, que se perdem no reload.
const TELAS_DA_URL = ['criar', 'partida', 'ranking', 'dashboard', 'faccoes'];

// O detalhe de uma facção fica em #faccao/<nome>, para também sobreviver ao F5.
const PREFIXO_FACCAO = 'faccao/';

const faccaoDaUrl = () => {
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith(PREFIXO_FACCAO)) return null;
    try {
        return decodeURIComponent(hash.slice(PREFIXO_FACCAO.length)) || null;
    } catch {
        return null; // hash malformado, ex.: "%E0"
    }
};

const telaDaUrl = () => {
    if (faccaoDaUrl()) return 'faccao';
    const tela = window.location.hash.slice(1);
    return TELAS_DA_URL.includes(tela) ? tela : 'criar';
};

function App() {
    const [tela, setTela] = useState(telaDaUrl); // 'criar', 'setup', 'partida', 'ranking', 'dashboard', 'faccoes' ou 'faccao'
    const [dadosMesa, setDadosMesa] = useState(null);
    const [faccaoSelecionada, setFaccaoSelecionada] = useState(faccaoDaUrl);

    useEffect(() => {
        const hash = tela === 'faccao'
            ? `${PREFIXO_FACCAO}${encodeURIComponent(faccaoSelecionada)}`
            : tela;
        window.history.replaceState(null, '', `#${hash}`);
    }, [tela, faccaoSelecionada]);

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

    const irParaDashboard = () => {
        setTela('dashboard');
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
                return <Faccoes onSelecionarFaccao={irParaFaccao} onVoltar={irParaDashboard} />;
            case 'faccao':
                return <FaccaoDetalhe faccao={faccaoSelecionada} onVoltar={irParaFaccoes} />;
            default:
                return <Dashboard onVerFaccoes={irParaFaccoes} />;
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
                    className={`nav-button ${['dashboard', 'faccoes', 'faccao'].includes(tela) ? 'active' : ''}`}
                    onClick={irParaDashboard}
                >
                    📊 Dashboard
                </button>
            </nav>

            <main>
                {renderizarTela()}
            </main>
        </div>
    )
}

export default App