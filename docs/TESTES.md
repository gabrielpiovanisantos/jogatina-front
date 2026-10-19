# 🧪 Guia de Testes - Jogatina Frontend

> Testes de integração, unitários e E2E

---

## 📊 O que foi criado

### **Testes Implementados:**
- ✅ Testes unitários do serviço de API (`api.test.js`)
- ✅ Testes do componente Ranking (`Ranking.test.jsx`)
- ✅ Testes do componente SetupMesa (`SetupMesa.test.jsx`)
- ✅ Testes de integração e E2E contra o backend real (`tests/`)
- ✅ Setup e configuração do Vitest

### **Dependências Adicionadas:**
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "@vitest/ui": "^1.1.0",
    "vitest": "^1.1.0",
    "jsdom": "^23.0.1"
  }
}
```

---

## 🚀 Como Rodar os Testes

### **Instalação**
```bash
cd C:\_developer\frontend-jogatina
npm install
```

### **Executar todos os testes**
```bash
npm run test
```

### **Modo watch (auto-reload)**
```bash
npm run test -- --watch
```

### **Ver cobertura**
```bash
npm run test:coverage
```

### **Interface gráfica**
```bash
npm run test:ui
```

---

## 📁 Estrutura de Testes

```
src/
├── tests/
│   ├── setup.js                    ← Configuração global
│   ├── api.test.js                 ← Testes do serviço de API
│   ├── Ranking.test.jsx            ← Testes do componente Ranking
│   └── SetupMesa.test.jsx          ← Testes do componente SetupMesa
│
├── services/
│   └── api.js                      ← Código sendo testado
│
└── pages/
    ├── Ranking.jsx                 ← Código sendo testado
    └── SetupMesa.jsx               ← Código sendo testado
```

---

## 🧪 Testes do Serviço de API (`api.test.js`)

### **O que testa:**

#### 1. `organizarMesas()`
- ✅ Faz requisição POST para `/api/setup/organize`
- ✅ Envia dados corretos no body
- ✅ Lança erro se resposta não for ok
- ✅ Valida Content-Type header

#### 2. `obterRanking()`
- ✅ Faz requisição GET para `/dashboard/ranking`
- ✅ Retorna array de jogadores
- ✅ Cada jogador tem propriedades corretas
- ✅ Lança erro se falhar

#### 3. `obterRankingJogador(playerId)`
- ✅ Faz requisição GET para `/dashboard/ranking/{id}`
- ✅ Aceita número ou string como ID
- ✅ Retorna dados corretos

#### 4. Tratamento de Erros
- ✅ Loga erros no console
- ✅ Lida com respostas vazias
- ✅ Valida headers

### **Executar apenas estes testes:**
```bash
npm run test -- api.test.js
```

### **Exemplo de teste:**
```javascript
it('deve fazer requisição POST para /api/setup/organize', async () => {
  const jogadores = [
    { id: 1, name: 'João' },
    { id: 2, name: 'Maria' }
  ];

  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ groups: [[...], [...]] })
  });

  const resultado = await apiService.organizarMesas(jogadores);

  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/setup/organize'),
    expect.objectContaining({ method: 'POST' })
  );
  expect(resultado.groups).toBeDefined();
});
```

---

## 🏆 Testes do Componente Ranking (`Ranking.test.jsx`)

### **O que testa:**

- ✅ Renderiza o componente
- ✅ Mostra carregamento inicial
- ✅ Renderiza tabela com ranking
- ✅ Exibe medalhas nas posições (🥇🥈🥉)
- ✅ Mostra mensagem quando ranking vazio
- ✅ Exibe erro quando requisição falha
- ✅ Chama `obterRanking()` apenas uma vez
- ✅ Exibe headers de tabela corretos

### **Executar apenas estes testes:**
```bash
npm run test -- Ranking.test.jsx
```

### **Exemplo de teste:**
```javascript
it('deve renderizar tabela com ranking de jogadores', async () => {
  const mockRanking = [
    { id: 1, name: 'João', points: 1500, games: 10, wins: 7 }
  ];

  apiService.default.obterRanking.mockResolvedValueOnce(mockRanking);
  render(<Ranking />);

  await waitFor(() => {
    expect(screen.getByText('João')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
  });
});
```

---

## 🎮 Testes do Componente SetupMesa (`SetupMesa.test.jsx`)

### **O que testa:**

- ✅ Renderiza o componente
- ✅ Exibe informações da mesa
- ✅ Adiciona jogador quando input preenchido
- ✅ Impede jogador duplicado
- ✅ Remove jogador quando botão clicado
- ✅ Desabilita "Organizar" com menos de 3 jogadores
- ✅ Chama `organizarMesas()` com dados corretos
- ✅ Exibe mesas organizadas após API responder
- ✅ Exibe erro quando API falha
- ✅ Permite reorganizar
- ✅ Conta total de confirmados

### **Executar apenas estes testes:**
```bash
npm run test -- SetupMesa.test.jsx
```

### **Exemplo de teste:**
```javascript
it('deve adicionar jogador quando input é preenchido', async () => {
  const user = userEvent.setup();
  render(<SetupMesa dadosMesa={mockDados} onVoltar={mockFn} />);

  const input = screen.getByPlaceholderText(/Nome do jogador/i);
  const botao = screen.getByRole('button', { name: '+' });

  await user.type(input, 'João');
  await user.click(botao);

  expect(screen.getByText('João')).toBeInTheDocument();
});
```

---

## 🔗 Testes de Integração e E2E com o backend real (`tests/`)

Ficam fora de `src/tests` porque precisam do backend (`../jogatina`) rodando.
`npm run test` continua rodando só os testes unitários (com `fetch` mockado).

### **Stack de teste**

`docker-compose.test.yml` sobe o backend + Postgres efêmero (tmpfs) em portas
próprias (**18080** e **15432**), isolado do ambiente de dev (8080/5432). Os
testes limpam e semeiam esse banco livremente.

```bash
npm run stack:test:up      # build do ../jogatina e espera ficar saudável
npm run test:integration   # Vitest: apiService + páginas contra o backend
npm run test:e2e           # Playwright: navegador → Vite → proxy → backend
npm run stack:test:down    # derruba e apaga o banco de teste
```

Na primeira vez: `npx playwright install chromium`.
Com Podman, o socket precisa estar ativo: `systemctl --user start podman.socket`.

### **Estrutura**

```
tests/
├── support/
│   ├── backend.js              ← aguardar backend, limpar e semear o Postgres
│   └── cenario.js              ← partidas de exemplo + ranking esperado
├── integration/                ← vitest.integration.config.js
│   ├── api.int.test.js         ← contrato do apiService com cada endpoint
│   └── paginas.int.test.jsx    ← Ranking/Dashboard/SetupMesa com fetch real
└── e2e/                        ← playwright.config.js
    ├── mesa.spec.js            ← Criar Mesa → Setup → Organizar Mesas
    └── ranking-dashboard.spec.js
```

Os dados são semeados direto no Postgres porque o backend ainda não tem
endpoint para registrar partidas.

### **Falhas esperadas (bugs conhecidos)**

Testes marcados com `it.fails` / `test.fail()` descrevem o comportamento
correto de algo que hoje está quebrado. Eles passam enquanto o bug existir;
quando o bug for corrigido passam a falhar, e a marcação deve ser removida.

- **`POST /api/games/finish` não existe no backend** (404), então
  `registrarPartida` sempre falha com dados reais.

`GET /dashboard/ranking/{id}` de jogador inexistente responde 200 com corpo
vazio, e o frontend acaba falhando com erro de parse de JSON em vez de um 404.

---

## 📊 Cobertura de Testes

### **Comando:**
```bash
npm run test:coverage
```

### **Esperado:**
- API Service: 95%+ de cobertura
- Componentes: 90%+ de cobertura
- Geral: 90%+ de cobertura

---

## 🛠️ Como Adicionar Novos Testes

### **Passo 1: Criar arquivo de teste**
```javascript
// src/tests/MeuComponente.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MeuComponente from '../../pages/MeuComponente.jsx';

describe('MeuComponente', () => {
  it('deve renderizar', () => {
    render(<MeuComponente />);
    expect(screen.getByText(/texto esperado/i)).toBeInTheDocument();
  });
});
```

### **Passo 2: Executar**
```bash
npm run test
```

### **Passo 3: Verificar cobertura**
```bash
npm run test:coverage
```

---

## 🎯 Melhores Práticas

### ✅ **Fazer:**
- ✅ Usar `userEvent` ao invés de `fireEvent` para simulações realistas
- ✅ Testar comportamento, não implementação
- ✅ Usar `waitFor` para código assíncrono
- ✅ Mockar dependências externas (API)
- ✅ Usar descritivos nos testes
- ✅ Um teste = um comportamento

### ❌ **Evitar:**
- ❌ Testar detalhes de implementação
- ❌ Testes muito complexos
- ❌ Não mockar requisições HTTP
- ❌ Testes que dependem de ordem
- ❌ Testar bibliotecas externas

---

## 📚 Ferramentas Usadas

| Ferramenta | O que faz |
|-----------|----------|
| **Vitest** | Framework de testes (similar ao Jest) |
| **Testing Library** | Renderizar componentes e queries |
| **jsdom** | DOM no Node.js |
| **user-event** | Simular interações do usuário |

---

## 🔍 Debugging Testes

### **Ver logs no teste:**
```javascript
import { screen, debug } from '@testing-library/react';

render(<Component />);
debug(); // Printa o HTML completo
```

### **Ver quais elementos estão disponíveis:**
```javascript
screen.logTestingPlaygroundURL(); // URL do Testing Playground
```

### **Executar teste específico:**
```bash
npm run test -- api.test.js -t "organizarMesas"
```

---

## 📈 Métricas

### **Testes Criados:**
- ✅ 12+ testes no api.test.js
- ✅ 10+ testes no Ranking.test.jsx
- ✅ 12+ testes no SetupMesa.test.jsx
- ✅ 10+ testes E2E documentados

### **Total: 44+ testes**

---

## 🚀 Próximos Passos

1. **Executar testes locais:** `npm run test`
2. **Ver cobertura:** `npm run test:coverage`
3. **Integração CI/CD:** Adicionar `npm run test` no pipeline
4. **Adicionar testes para novos features**
5. **Manter cobertura acima de 90%**

---

## 📞 Comandos Rápidos

```bash
# Todos os testes
npm run test

# Com watch
npm run test -- --watch

# Interface gráfica
npm run test:ui

# Um teste específico
npm run test -- api.test.js

# Com cobertura
npm run test:coverage

# Verbose (detalhado)
npm run test -- --reporter=verbose
```

---

## 💡 Tips

1. **Mockar API:** Use `vi.mock()` para mockar módulos
2. **Simular user:** Use `userEvent.setup()` para interações
3. **Async:** Use `waitFor()` para operações assíncronas
4. **Snapshots:** Evitar a menos que necessário
5. **Performance:** Testes devem rodar em < 1s cada

---

**Status:** ✅ Testes Criados e Prontos
**Versão:** 1.0
**Data:** 11 de Agosto de 2026

Comece com: `npm run test` 🚀

