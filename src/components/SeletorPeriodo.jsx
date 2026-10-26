import { useContext, useState } from 'react';
import {
    ATALHOS_PERIODO, PERIODO_PADRAO, diasDoPeriodo, periodoPersonalizado, periodoSalvo, periodoSalvoDe,
    ehPeriodoSalvo, temFiltro, datasDoPeriodo
} from '../utils/periodo.js';
import { paraAAAAMMDD } from '../utils/datas.js';
import { PeriodosContexto } from '../utils/periodosContexto.js';
import './SeletorPeriodo.css';

const PERSONALIZADO = 'personalizado';
// Valor vazio dos dois selects: o período fica neutro quando vale uma temporada,
// e a temporada fica vazia quando vale um período
const NENHUM = '';

// Filtro compartilhado pelos dashboards e pelo Ranking, em dois selects que
// definem o mesmo período: "Período" (atalhos e Personalizado) e "Temporada"
// (os períodos salvos, criados na tela Temporadas). Escolher um anula o outro.
// Só avisa o pai quando a escolha está completa: um atalho, uma temporada ou
// as duas datas do personalizado em ordem.
export default function SeletorPeriodo({ periodo, onMudar }) {
    const { salvos, erro } = useContext(PeriodosContexto);
    const diasAtuais = diasDoPeriodo(periodo);
    const [escolheuPersonalizado, setEscolheuPersonalizado] = useState(false);
    const [de, setDe] = useState(diasAtuais?.de ?? '');
    const [ate, setAte] = useState(diasAtuais?.ate ?? '');
    const hoje = paraAAAAMMDD(new Date());
    const datasInvertidas = de && ate && de > ate;


    const temporadaAtiva = ehPeriodoSalvo(periodo);
    const modoPersonalizado = !temporadaAtiva && (escolheuPersonalizado || diasAtuais !== null);
    const valorPeriodo = temporadaAtiva ? NENHUM : (modoPersonalizado ? PERSONALIZADO : periodo);
    const valorTemporada = temporadaAtiva ? periodo : NENHUM;
    const semTemporadas = salvos.length === 0;

    const mudarTemporada = (valor) => {
        setEscolheuPersonalizado(false);
        // Limpar a temporada volta ao padrão
        onMudar(valor === NENHUM ? PERIODO_PADRAO : valor);
    };

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
                <div className="campo-seletor">
                    <label htmlFor="seletor-periodo">Período:</label>
                    <select id="seletor-periodo" value={valorPeriodo} onChange={(e) => mudarEscolha(e.target.value)}>
                        {/* Aparece só quando vale uma temporada; não dá para escolher */}
                        <option value={NENHUM} disabled>—</option>
                        {ATALHOS_PERIODO.map(a => (
                            <option key={a.id} value={a.id}>{a.rotulo}</option>
                        ))}
                        <option value={PERSONALIZADO}>Personalizado</option>
                    </select>
                </div>

                <div className="campo-seletor">
                    <label htmlFor="seletor-temporada">Temporada:</label>
                    <select
                        id="seletor-temporada"
                        value={valorTemporada}
                        disabled={semTemporadas}
                        aria-describedby={erro ? 'erro-temporadas' : undefined}
                        onChange={(e) => mudarTemporada(e.target.value)}
                    >
                        {semTemporadas ? (
                            <option value={NENHUM}>Nenhuma temporada</option>
                        ) : (
                            <>
                                <option value={NENHUM}>—</option>
                                {salvos.map(p => (
                                    <option key={p.id} value={periodoSalvo(p.id)}>{p.name}</option>
                                ))}
                            </>
                        )}
                    </select>
                    {erro && <div id="erro-temporadas" className="aviso-periodo">⚠️ {erro}</div>}
                </div>
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
        </div>
    );
}
