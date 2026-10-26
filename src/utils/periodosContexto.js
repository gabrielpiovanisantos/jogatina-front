import { createContext } from 'react';

// Períodos salvos do backend, para o SeletorPeriodo de qualquer tela.
// O App é quem carrega e fornece; sem provedor (ex.: nos testes de uma página),
// o seletor de temporada aparece vazio e desabilitado.
export const PeriodosContexto = createContext({
    salvos: [],
    erro: null,
    criarPeriodo: null,
    atualizarPeriodo: null,
    excluirPeriodo: null
});
