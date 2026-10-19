import { useState } from 'react';
import './CriarMesa.css';
import { paraAAAAMMDD, formatarDataBR } from '../utils/datas.js';

export default function CriarMesa({ onContinuar }) {
    const [data, setData] = useState('');
    const [jogo, setJogo] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [mostraResumo, setMostraResumo] = useState(false);

    const obterDataMinima = () => {
        return paraAAAAMMDD(new Date());
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!data || !jogo || !quantidade) {
            alert('Por favor, preencha todos os campos');
            return;
        }

        if (parseInt(quantidade) < 2 || parseInt(quantidade) > 20) {
            alert('A quantidade deve estar entre 2 e 20 pessoas');
            return;
        }

        setMostraResumo(true);
    };

    const handleConfirmar = () => {
        onContinuar({ data, jogo, quantidade: parseInt(quantidade) });
    };

    const handleVoltar = () => {
        setMostraResumo(false);
    };

    return (
        <div className="cartao-criar-mesa">
            {!mostraResumo ? (
                <>
                    <h1>Criar Nova Mesa</h1>
                    <p>Preencha os dados para organizar sua partida</p>

                    <form onSubmit={handleSubmit}>
                        <div className="formulario-grupo">
                            <label htmlFor="data">Data da Partida:</label>
                            <input
                                id="data"
                                type="date"
                                min={obterDataMinima()}
                                value={data}
                                onChange={(e) => setData(e.target.value)}
                            />
                        </div>

                        <div className="formulario-grupo">
                            <label htmlFor="jogo">Qual Jogo:</label>
                            <select
                                id="jogo"
                                value={jogo}
                                onChange={(e) => setJogo(e.target.value)}
                            >
                                <option value="">Selecione um jogo...</option>
                                <option value="Root">Root</option>
                            </select>
                        </div>

                        <div className="formulario-grupo">
                            <label htmlFor="quantidade">Quantidade de Pessoas:</label>
                            <input
                                id="quantidade"
                                type="number"
                                min="2"
                                max="20"
                                placeholder="Ex: 6"
                                value={quantidade}
                                onChange={(e) => setQuantidade(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="btn-continuar">
                            Continuar
                        </button>
                    </form>
                </>
            ) : (
                <>
                    <h1>Resumo da Mesa</h1>
                    <div className="resumo-mesa">
                        <div className="resumo-item">
                            <span className="resumo-label">📅 Data:</span>
                            <span className="resumo-valor">{formatarDataBR(data)}</span>
                        </div>
                        <div className="resumo-item">
                            <span className="resumo-label">🎲 Jogo:</span>
                            <span className="resumo-valor">{jogo}</span>
                        </div>
                        <div className="resumo-item">
                            <span className="resumo-label">👥 Pessoas:</span>
                            <span className="resumo-valor">{quantidade}</span>
                        </div>
                    </div>

                    <div className="botoes-resumo">
                        <button onClick={handleVoltar} className="btn-voltar-resumo">
                            ← Voltar
                        </button>
                        <button onClick={handleConfirmar} className="btn-confirmar-resumo">
                            Confirmar e Continuar
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

