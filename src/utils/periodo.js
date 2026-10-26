// Período dos dashboards, guardado como texto para caber no hash da URL:
//   'tudo'                   todo o histórico (sem from nem to)
//   '3m', '12m'              últimos 3 ou 12 meses, contando o dia de hoje
//   'ano'                    de 1º de janeiro até hoje
//   'AAAA-MM-DD_AAAA-MM-DD'  intervalo personalizado, os dois dias inclusive
//   'salvo:<id>'             um período salvo no backend, ex.: 'salvo:7'
// Os limites são calculados no fuso do usuário, como no RegistrarPartida.
// Os períodos salvos vêm do backend: o App os registra aqui com
// definirPeriodosSalvos assim que carrega (e de novo a cada mudança).
import { intervaloDoDia, paraAAAAMMDD, formatarDataBR } from './datas.js';

export const PERIODO_PADRAO = 'tudo';

export const ATALHOS_PERIODO = [
    { id: 'tudo', rotulo: 'Tudo' },
    { id: '3m', rotulo: 'Últimos 3 meses' },
    { id: '12m', rotulo: 'Últimos 12 meses' },
    { id: 'ano', rotulo: 'Este ano' }
];

const DIA = /^\d{4}-\d{2}-\d{2}$/;

const diaValido = (aaaammdd) => {
    if (!DIA.test(aaaammdd)) return false;
    const { inicio } = intervaloDoDia(aaaammdd);
    return paraAAAAMMDD(inicio) === aaaammdd; // recusa 2026-02-31 e afins
};

export const periodoPersonalizado = (de, ate) => `${de}_${ate}`;

const PREFIXO_SALVO = 'salvo:';
export const periodoSalvo = (id) => `${PREFIXO_SALVO}${id}`;

// Períodos salvos (GET /api/periods: { id, name, from, to|null }), compartilhados por todos
let periodosSalvos = [];

export const definirPeriodosSalvos = (salvos = []) => {
    periodosSalvos = salvos;
};

// O período é um salvo, que só se resolve depois de carregar a lista do backend?
export const ehPeriodoSalvo = (periodo) => String(periodo).startsWith(PREFIXO_SALVO);

// { id, name, from, to } do período salvo, ou null se não for um ou se não existir (mais)
export const periodoSalvoDe = (periodo) => {
    if (!ehPeriodoSalvo(periodo)) return null;
    const id = String(periodo).slice(PREFIXO_SALVO.length);
    return periodosSalvos.find(p => String(p.id) === id) ?? null;
};

// { de, ate } de um período personalizado, ou null se não for um
export const diasDoPeriodo = (periodo) => {
    const [de, ate, ...resto] = String(periodo).split('_');
    if (resto.length || !diaValido(de ?? '') || !diaValido(ate ?? '') || de > ate) return null;
    return { de, ate };
};

export const periodoValido = (periodo) =>
    ATALHOS_PERIODO.some(a => a.id === periodo)
    || diasDoPeriodo(periodo) !== null
    || periodoSalvoDe(periodo) !== null;

// Mesmo dia do mês, N meses antes; no fim do mês, cai no último dia que existe
// (31/05 - 3 meses = 28/02 ou 29/02).
const mesesAntes = (data, meses) => {
    const alvo = new Date(data.getFullYear(), data.getMonth() - meses, 1);
    const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
    return new Date(alvo.getFullYear(), alvo.getMonth(), Math.min(data.getDate(), ultimoDia));
};

/**
 * Limites do período para a API: { from, to } com Date ou null (limite aberto).
 * Os atalhos só têm início: o fim fica aberto, já que não há partida no futuro.
 * @returns {{ from: Date|null, to: Date|null }}
 */
export const limitesDoPeriodo = (periodo, hoje = new Date()) => {
    const inicioDeHoje = intervaloDoDia(paraAAAAMMDD(hoje)).inicio;
    switch (periodo) {
        case '3m':
            return { from: mesesAntes(inicioDeHoje, 3), to: null };
        case '12m':
            return { from: mesesAntes(inicioDeHoje, 12), to: null };
        case 'ano':
            return { from: new Date(hoje.getFullYear(), 0, 1), to: null };
        default: {
            const salvo = periodoSalvoDe(periodo);
            if (salvo) {
                return { from: new Date(salvo.from), to: salvo.to ? new Date(salvo.to) : null };
            }
            const dias = diasDoPeriodo(periodo);
            if (!dias) return { from: null, to: null };
            return { from: intervaloDoDia(dias.de).inicio, to: intervaloDoDia(dias.ate).fim };
        }
    }
};

export const temFiltro = (periodo) => periodoValido(periodo) && periodo !== PERIODO_PADRAO;

// Com período, o backend lista todos os jogadores e zera quem não jogou nele.
// Regra única para o Dashboard de Jogadores e o Ranking: esses ficam de fora.
export const jogadoresDoPeriodo = (jogadores, periodo) =>
    temFiltro(periodo) ? jogadores.filter(j => j.totalGames > 0) : jogadores;

// Texto curto para as mensagens de estado vazio
export const descreverPeriodo = (periodo) => {
    const atalho = ATALHOS_PERIODO.find(a => a.id === periodo);
    if (atalho) return atalho.rotulo.toLowerCase();
    const salvo = periodoSalvoDe(periodo);
    if (salvo) return salvo.name;
    const dias = diasDoPeriodo(periodo);
    return dias ? `de ${formatarDataBR(dias.de)} a ${formatarDataBR(dias.ate)}` : '';
};

const diaBR = (data) => formatarDataBR(paraAAAAMMDD(data));

// Datas do período para mostrar na tela, ex.: "01/01/2026 – hoje". O "to" é
// exclusivo, então o último dia é o anterior a ele; sem fim, o período vai até hoje.
export const datasDoPeriodo = (periodo, hoje = new Date()) => {
    if (!temFiltro(periodo)) return '';
    const { from, to } = limitesDoPeriodo(periodo, hoje);
    const fim = to ? diaBR(new Date(to.getTime() - 1)) : 'hoje';
    return from ? `${diaBR(from)} – ${fim}` : `até ${fim}`;
};
