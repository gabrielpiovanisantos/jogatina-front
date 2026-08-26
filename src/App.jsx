import { useState } from 'react';
import './App.css'
import CriarMesa from "./pages/CriarMesa.jsx";
import SetupMesa from "./pages/SetupMesa.jsx";
import Ranking from "./pages/Ranking.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function App() {
    const [tela, setTela] = useState('criar'); // 'criar', 'setup', 'ranking' ou 'dashboard'
    const [dadosMesa, setDadosMesa] = useState(null);

    const irParaSetup = (dados) => {
        setDadosMesa(dados);
        setTela('setup');
    };

    const voltarParaCriar = () => {
        setTela('criar');
    };

    const irParaRanking = () => {
        setTela('ranking');
    };

    const irParaDashboard = () => {
        setTela('dashboard');
    };

    const renderizarTela = () => {
        switch (tela) {
            case 'criar':
                return <CriarMesa onContinuar={irParaSetup} />;
            case 'setup':
                return <SetupMesa dadosMesa={dadosMesa} onVoltar={voltarParaCriar} />;
            case 'ranking':
                return <Ranking />;
            default:
                return <Dashboard />;
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
                    className={`nav-button ${tela === 'ranking' ? 'active' : ''}`}
                    onClick={irParaRanking}
                >
                    🏆 Ranking
                </button>
                <button
                    className={`nav-button ${tela === 'dashboard' ? 'active' : ''}`}
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