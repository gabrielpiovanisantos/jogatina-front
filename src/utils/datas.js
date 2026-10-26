// Datas do <input type="date"> vêm como "AAAA-MM-DD" e representam um dia no
// calendário local. new Date("AAAA-MM-DD") as interpreta como meia-noite UTC
// (dia anterior em fusos negativos, como o do Brasil), então convertemos à mão.

export const paraAAAAMMDD = (d) => [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
].join('-');

export const formatarDataBR = (aaaammdd) => aaaammdd.split('-').reverse().join('/');

const partes = (aaaammdd) => aaaammdd.split('-').map(Number);

// Início e fim (exclusivo) do dia no fuso local, para consultar o backend.
export const intervaloDoDia = (aaaammdd) => {
    const [ano, mes, dia] = partes(aaaammdd);
    return { inicio: new Date(ano, mes - 1, dia), fim: new Date(ano, mes - 1, dia + 1) };
};

// O dia escolhido com o horário de agora: mantém a ordem das partidas do mesmo dia.
export const dataComHoraAtual = (aaaammdd) => {
    const [ano, mes, dia] = partes(aaaammdd);
    const agora = new Date();
    return new Date(ano, mes - 1, dia, agora.getHours(), agora.getMinutes(), agora.getSeconds());
};

// Mesma regra do backend: a partida pode ter até 5 minutos à frente de agora
// (folga para relógio adiantado); depois disso é data no futuro e é recusada.
export const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;

export const dataNoFuturo = (dateTime, agora = new Date()) =>
    new Date(dateTime).getTime() > agora.getTime() + TOLERANCIA_FUTURO_MS;
