import { useState } from 'react';
import { ATALHOS_PERIODO, diasDoPeriodo, periodoPersonalizado } from '../utils/periodo.js';
import { paraAAAAMMDD } from '../utils/datas.js';
import './SeletorPeriodo.css';

const PERSONALIZADO = 'personalizado';

// Seletor de período compartilhado pelos dashboards. Só avisa o pai quando o
// período está completo: um atalho, ou as duas datas do personalizado em ordem.
export default function SeletorPeriodo({ periodo, onMudar }) {
    const diasAtuais = diasDoPeriodo(periodo);
    const [escolha, setEscolha] = useState(diasAtuais ? PERSONALIZADO : periodo);
    const [de, setDe] = useState(diasAtuais?.de ?? '');
    const [ate, setAte] = useState(diasAtuais?.ate ?? '');
    const hoje = paraAAAAMMDD(new Date());
    const datasInvertidas = de && ate && de > ate;

    const mudarEscolha = (valor) => {
        setEscolha(valor);
        if (valor !== PERSONALIZADO) {
            onMudar(valor);
        } else if (de && ate && de <= ate) {
            onMudar(periodoPersonalizado(de, ate));
        }
    };

    const mudarData = (novoDe, novoAte) => {
        setDe(novoDe);
        setAte(novoAte);
        if (novoDe && novoAte && novoDe <= novoAte) {
            onMudar(periodoPersonalizado(novoDe, novoAte));
        }
    };

    return (
        <div className="seletor-periodo">
            <label htmlFor="seletor-periodo">Período:</label>
            <select id="seletor-periodo" value={escolha} onChange={(e) => mudarEscolha(e.target.value)}>
                {ATALHOS_PERIODO.map(a => (
                    <option key={a.id} value={a.id}>{a.rotulo}</option>
                ))}
                <option value={PERSONALIZADO}>Personalizado</option>
            </select>

            {escolha === PERSONALIZADO && (
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

            {escolha === PERSONALIZADO && datasInvertidas && (
                <div className="aviso-periodo" role="alert">A data inicial precisa ser anterior ou igual à final.</div>
            )}
        </div>
    );
}
