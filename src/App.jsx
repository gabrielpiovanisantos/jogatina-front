import { useState } from 'react';
import './App.css'
import CriarMesa from "./pages/CriarMesa.jsx";
import SetupMesa from "./pages/SetupMesa.jsx";

function App() {
    const [tela, setTela] = useState('criar'); // 'criar' ou 'setup'
    const [dadosMesa, setDadosMesa] = useState(null);

    const irParaSetup = (dados) => {
        setDadosMesa(dados);
        setTela('setup');
    };

    const voltarParaCriar = () => {
        setTela('criar');
    };

    return (
        <div className="app-container">
            <main>
                {tela === 'criar' ? (
                    <CriarMesa onContinuar={irParaSetup} />
                ) : (
                    <SetupMesa dadosMesa={dadosMesa} onVoltar={voltarParaCriar} />
                )}
            </main>
        </div>
    )
}

export default App