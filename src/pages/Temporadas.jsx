import { useContext, useState } from 'react';
import { intervaloDoDia, paraAAAAMMDD } from '../utils/datas.js';
import { datasDoPeriodo, periodoSalvo } from '../utils/periodo.js';
import { PeriodosContexto } from '../utils/periodosContexto.js';
import './Temporadas.css';

// "Fim" é o último dia da temporada, inclusive; o backend guarda "to" exclusivo
const paraEnvio = ({ nome, inicio, fim }) => ({
    name: nome.trim(),
    from: intervaloDoDia(inicio).inicio.toISOString(),
    to: fim ? intervaloDoDia(fim).fim.toISOString() : null
});

const paraFormulario = (temporada) => ({
    nome: temporada.name,
    inicio: paraAAAAMMDD(new Date(temporada.from)),
    fim: temporada.to ? paraAAAAMMDD(new Date(new Date(temporada.to).getTime() - 1)) : ''
});

const formularioNovo = () => ({ nome: '', inicio: paraAAAAMMDD(new Date()), fim: '' });

const fimAntesDoInicio = ({ inicio, fim }) => fim && fim < inicio;

// Temporadas são os períodos salvos (/api/periods), que valem para todo mundo e
// aparecem no seletor de período do Ranking e dos dashboards. Aqui se cria uma
// nova (opcionalmente encerrando a que está em andamento) e se edita ou exclui
// as existentes.
export default function Temporadas({ onVerRanking }) {
    const { salvos: temporadas, erro: erroLista, criarPeriodo, atualizarPeriodo, excluirPeriodo } = useContext(PeriodosContexto);

    const [nova, setNova] = useState(formularioNovo);
    const [encerrarAnterior, setEncerrarAnterior] = useState(true);
    const [salvandoNova, setSalvandoNova] = useState(false);
    const [erroNova, setErroNova] = useState(null);
    const [criada, setCriada] = useState(null);
    const [avisoEncerrar, setAvisoEncerrar] = useState(null);

    const [edicao, setEdicao] = useState(null); // { id, nome, inicio, fim }
    // Erro ao editar ou excluir uma temporada da lista
    const [erroAcao, setErroAcao] = useState(null);

    // A lista vem do início mais recente para o mais antigo: a primeira sem fim é a em andamento
    const emAndamento = temporadas.find(t => !t.to);

    const criar = async (e) => {
        e.preventDefault();
        setErroNova(null);
        setCriada(null);
        setAvisoEncerrar(null);

        if (fimAntesDoInicio(nova)) {
            setErroNova('A data de fim precisa ser igual ou posterior à de início.');
            return;
        }
        const dados = paraEnvio(nova);
        const vaiEncerrar = Boolean(emAndamento && encerrarAnterior);
        if (vaiEncerrar && new Date(dados.from) <= new Date(emAndamento.from)) {
            setErroNova(`A nova temporada precisa começar depois do início de "${emAndamento.name}" para encerrá-la.`);
            return;
        }

        setSalvandoNova(true);
        try {
            // 1º passo: criar a nova. Se falhar, nada mudou.
            let recemCriada;
            try {
                recemCriada = await criarPeriodo(dados);
            } catch (error) {
                setErroNova(error.message);
                return;
            }
            setCriada(recemCriada);
            setNova(formularioNovo());

            // 2º passo: encerrar a anterior no início da nova
            if (vaiEncerrar) {
                try {
                    await atualizarPeriodo(emAndamento.id, { name: emAndamento.name, from: emAndamento.from, to: recemCriada.from });
                } catch (error) {
                    setAvisoEncerrar(`A temporada "${recemCriada.name}" foi criada, mas não deu para encerrar "${emAndamento.name}": ${error.message}. Edite-a abaixo para definir o fim.`);
                }
            }
        } finally {
            setSalvandoNova(false);
        }
    };

    const salvarEdicao = async (e) => {
        e.preventDefault();
        setErroAcao(null);
        if (fimAntesDoInicio(edicao)) {
            setErroAcao('A data de fim precisa ser igual ou posterior à de início.');
            return;
        }
        try {
            await atualizarPeriodo(edicao.id, paraEnvio(edicao));
            setEdicao(null);
        } catch (error) {
            setErroAcao(error.message);
        }
    };

    const excluir = async (temporada) => {
        if (!window.confirm(`Excluir a temporada "${temporada.name}"? Ela some para todo mundo.`)) return;
        setErroAcao(null);
        try {
            await excluirPeriodo(temporada.id);
            if (edicao?.id === temporada.id) setEdicao(null);
            if (criada?.id === temporada.id) setCriada(null);
        } catch (error) {
            setErroAcao(error.message);
        }
    };

    return (
        <div className="temporadas-container">
            <h1>🗓️ Temporadas</h1>
            <p className="explicacao-temporadas">
                Uma temporada é um período com nome que todo mundo pode escolher no Ranking e nos dashboards.
                Para "resetar o ranking", crie uma nova temporada.
            </p>

            <section aria-labelledby="titulo-nova-temporada">
                <h2 id="titulo-nova-temporada">Nova temporada</h2>
                <form className="formulario-temporada" onSubmit={criar}>
                    <label>
                        Nome
                        <input
                            type="text"
                            required
                            maxLength={100}
                            value={nova.nome}
                            onChange={(e) => setNova(n => ({ ...n, nome: e.target.value }))}
                        />
                    </label>
                    <label>
                        Início
                        <input
                            type="date"
                            required
                            value={nova.inicio}
                            onChange={(e) => setNova(n => ({ ...n, inicio: e.target.value }))}
                        />
                    </label>
                    <label>
                        Fim (opcional)
                        <input
                            type="date"
                            value={nova.fim}
                            onChange={(e) => setNova(n => ({ ...n, fim: e.target.value }))}
                        />
                    </label>
                    <p className="dica-temporada">Sem fim, a temporada fica em andamento até alguém encerrá-la.</p>

                    {emAndamento && (
                        <label className="opcao-encerrar">
                            <input
                                type="checkbox"
                                checked={encerrarAnterior}
                                onChange={(e) => setEncerrarAnterior(e.target.checked)}
                            />
                            Encerrar a temporada &quot;{emAndamento.name}&quot; no início da nova
                        </label>
                    )}

                    {erroNova && <div className="erro-mensagem" role="alert">⚠️ {erroNova}</div>}

                    <button type="submit" className="botao-principal" disabled={salvandoNova}>
                        {salvandoNova ? 'Criando...' : 'Criar temporada'}
                    </button>
                </form>

                {criada && (
                    <div className="sucesso-temporada" role="status">
                        ✅ Temporada &quot;{criada.name}&quot; criada ({datasDoPeriodo(periodoSalvo(criada.id))}).
                        <button type="button" className="botao-principal" onClick={() => onVerRanking(criada.id)}>
                            🏆 Ver o Ranking nesta temporada
                        </button>
                    </div>
                )}
                {avisoEncerrar && <div className="erro-mensagem" role="alert">⚠️ {avisoEncerrar}</div>}
            </section>

            <section aria-labelledby="titulo-lista-temporadas">
                <h2 id="titulo-lista-temporadas">Temporadas</h2>

                {erroLista && <div className="erro-mensagem">⚠️ {erroLista}</div>}
                {erroAcao && <div className="erro-mensagem" role="alert">⚠️ {erroAcao}</div>}

                {temporadas.length === 0 ? (
                    <div className="mensagem-vazia">Nenhuma temporada ainda. Crie a primeira acima. 🎮</div>
                ) : (
                    <ul className="lista-temporadas">
                        {temporadas.map(t => (
                            <li key={t.id}>
                                {edicao?.id === t.id ? (
                                    <form className="formulario-temporada" onSubmit={salvarEdicao} aria-label={`Editar ${t.name}`}>
                                        <label>
                                            Nome
                                            <input
                                                type="text"
                                                required
                                                maxLength={100}
                                                value={edicao.nome}
                                                onChange={(e) => setEdicao(ed => ({ ...ed, nome: e.target.value }))}
                                            />
                                        </label>
                                        <label>
                                            Início
                                            <input
                                                type="date"
                                                required
                                                value={edicao.inicio}
                                                onChange={(e) => setEdicao(ed => ({ ...ed, inicio: e.target.value }))}
                                            />
                                        </label>
                                        <label>
                                            Fim (opcional)
                                            <input
                                                type="date"
                                                value={edicao.fim}
                                                onChange={(e) => setEdicao(ed => ({ ...ed, fim: e.target.value }))}
                                            />
                                        </label>
                                        <div className="acoes-temporada">
                                            <button type="submit" className="botao-principal">Salvar</button>
                                            <button type="button" onClick={() => { setEdicao(null); setErroAcao(null); }}>Cancelar</button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <span>
                                            <strong>{t.name}</strong>
                                            {!t.to && <span className="selo-andamento"> em andamento</span>}
                                            <br />
                                            <span className="datas-temporada">{datasDoPeriodo(periodoSalvo(t.id))}</span>
                                        </span>
                                        <span className="acoes-temporada">
                                            <button type="button" onClick={() => onVerRanking(t.id)}>
                                                Ranking <span className="sr-only">de {t.name}</span>
                                            </button>
                                            <button type="button" onClick={() => { setErroAcao(null); setEdicao({ id: t.id, ...paraFormulario(t) }); }}>
                                                Editar <span className="sr-only">{t.name}</span>
                                            </button>
                                            <button type="button" onClick={() => excluir(t)}>
                                                Excluir <span className="sr-only">{t.name}</span>
                                            </button>
                                        </span>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
