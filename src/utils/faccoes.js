// Formatação dos números do dashboard de facções no padrão brasileiro.
// winPercentage vem de 0 a 100, igual ao ranking de jogadores.

const umaCasa = (n) => Number(n ?? 0).toFixed(1).replace('.', ',');

export const formatarPorcentagem = (winPercentage) => `${umaCasa(winPercentage)}%`;

export const formatarMedia = (averageScore) => umaCasa(averageScore);
