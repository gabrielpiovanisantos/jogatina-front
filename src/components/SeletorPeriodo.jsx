import { useContext, useState } from 'react';
import {
    ATALHOS_PERIODO, diasDoPeriodo, periodoPersonalizado, periodoSalvo, periodoSalvoDe,
    temFiltro, datasDoPeriodo
} from '../utils/periodo.js';
import { paraAAAAMMDD } from '../utils/datas.js';
import { PeriodosContexto } from '../utils/periodosContexto.js';
import './SeletorPeriodo.css';

const PERSONALIZADO = 'personalizado';

// Seletor de período compartilhado pelos dashboards e pelo Ranking. Só avisa o
// pai quando o período está completo: um atalho, uma temporada (período salvo)
// ou as duas datas do personalizado em ordem. As temporadas são criadas e
// editadas na tela Temporadas.
export default function SeletorPeriodo({ periodo, onMudar }) {
    const { salvos, erro, abrirTemporadas } = useContext(PeriodosContexto);
    const diasAtuais = diasDoPeriodo(periodo);
    const [escolheuPersonalizado, setEscolheuPersonalizado] = useState(false);
    const [de, setDe] = useState(diasAtuais?.de ?? '');
    const [ate, setAte] = useState(diasAtuais?.ate ?? '');
    const hoje = paraAAAAMMDD(new Date());
    const datasInvertidas = de && ate && de > ate;


    const modoPersonalizado = escolheuPersonalizado || diasAtuais !== null;
    const valorSelecionado = modoPersonalizado ? PERSONALIZADO : periodo;

    const mudarEscolha = (valor) => {
        if (valor !== PERSONALIZADO) {
            setEscolheuPersonalizado(false);
            onMudar(valor);
        } else {
            setEscolheuPersonalizado(true);
            if (de && ate && de <= ate) onMudar(periodoPersonalizado(de, ate));
        }
    };

    const mudarData = (novoDe, novoAte) => {
        setDe(novoDe);
        setAte(novoAte);
        if (novoDe && novoAte && novoDe <= novoAte) {
            onMudar(periodoPersonalizado(novoDe, novoAte));
        }
    };

    // Nome e datas do que está valendo, ex.: "Temporada 1: 01/01/2026 – hoje"
    const nomeEscolhido = periodoSalvoDe(periodo)?.name
        ?? ATALHOS_PERIODO.find(a => a.id === periodo)?.rotulo
        ?? 'Personalizado';

    return (
        <div className="seletor-periodo">
            <div className="linha-seletor">
                <label htmlFor="seletor-periodo">Período:</label>
                <select id="seletor-periodo" value={valorSelecionado} onChange={(e) => mudarEscolha(e.target.value)}>
                    {ATALHOS_PERIODO.map(a => (
                        <option key={a.id} value={a.id}>{a.rotulo}</option>
                    ))}
                    {salvos.length > 0 && (
                        <optgroup label="Temporadas">
                            {salvos.map(p => (
                                <option key={p.id} value={periodoSalvo(p.id)}>{p.name}</option>
                            ))}
                        </optgroup>
                    )}
                    <option value={PERSONALIZADO}>Personalizado</option>
                </select>

                {abrirTemporadas && (
                    <button type="button" className="botao-gerenciar" onClick={abrirTemporadas}>
                        🗓️ Gerenciar temporadas
                    </button>
                )}
            </div>

            {modoPersonalizado && (
                <span className="datas-periodo">
                    <label>
                        De
                        <input
                            type="date"
                            max={hoje}
                            value={de}
                            onChange={(e) => mudarData(e.target.value, ate)}
                        />
                    </label>
                    <label>
                        Até
                        <input
                            type="date"
                            max={hoje}
                            value={ate}
                            onChange={(e) => mudarData(de, e.target.value)}
                        />
                    </label>
                </span>
            )}

            {modoPersonalizado && datasInvertidas && (
                <div className="aviso-periodo" role="alert">A data inicial precisa ser anterior ou igual à final.</div>
            )}

            {temFiltro(periodo) && (
                <p className="periodo-escolhido" aria-live="polite">
                    {modoPersonalizado ? datasDoPeriodo(periodo) : `${nomeEscolhido}: ${datasDoPeriodo(periodo)}`}
                </p>
            )}

            {erro && <div className="aviso-periodo">⚠️ {erro}</div>}
        </div>
    );
}
