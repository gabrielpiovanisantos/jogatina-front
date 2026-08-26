# 🛠️ Como Estender a Integração - Guia do Desenvolvedor

> Adicione novos endpoints e features facilmente!

---

## 📌 Arquitetura Atual

```
┌──────────────────────────────────────────────────────┐
│                  React Component                      │
│           (CriarMesa, SetupMesa, Ranking)            │
└──────────────────┬───────────────────────────────────┘
                   │
                   ↓ Import
        ┌──────────────────────┐
        │  src/services/api.js │  ⭐ Centralizador
        │   (apiService)       │
        └──────────┬───────────┘
                   │
                   ↓ HTTP (fetch)
        ┌──────────────────────┐
        │  Vite Proxy          │
        │  /api/* → :8080/api/*│
        └──────────┬───────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │  Spring Boot Backend │
        │  (localhost:8080)    │
        └──────────────────────┘
```

---

## ✅ Checklist: Adicionar Novo Endpoint

### **1. Backend tem um novo endpoint?**

Exemplo: `POST /api/games/save` para salvar partida

```kotlin
// SetupController.kt
@PostMapping("/games/save")
fun saveGame(@RequestBody gameRequest: GameRequest): ResponseEntity<GameResponse> {
    val game = gameService.save(gameRequest)
    return ResponseEntity.ok(game)
}
```

### **2. Adicionar método em `src/services/api.js`**

```javascript
export const apiService = {
  // ...existing methods...
  
  // ✨ Novo método
  salvarPartida: async (dadosPartida) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/games/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosPartida)
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao salvar partida`);
      }

      return response.json();
    } catch (error) {
      console.error('Erro ao salvar partida:', error);
      throw error;
    }
  }
};
```

### **3. Usar em seu componente**

```javascript
// SetupMesa.jsx ou novo componente
import apiService from '../services/api.js';

const salvarResultado = async () => {
  try {
    const resultado = await apiService.salvarPartida({
      gameId: 123,
      players: [
        { playerId: 1, position: 1 },
        { playerId: 2, position: 2 }
      ]
    });
    console.log('Partida salva:', resultado);
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

---

## 🎨 Criar Nova Página

### **1. Criar componente**

```javascript
// src/pages/Historico.jsx
import { useState, useEffect } from 'react';
import './Historico.css';
import apiService from '../services/api.js';

export default function Historico() {
  const [jogos, setJogos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscar = async () => {
      try {
        // TODO: quando backend tiver endpoint
        // const dados = await apiService.obterJogos();
        // setJogos(dados);
      } catch (error) {
        console.error(error);
      } finally {
        setCarregando(false);
      }
    };
    buscar();
  }, []);

  return (
    <div className="historico-container">
      <h1>📋 Histórico de Partidas</h1>
      {/* Render jogos */}
    </div>
  );
}
```

### **2. Adicionar ao App.jsx**

```javascript
import Historico from "./pages/Historico.jsx";

function App() {
  const [tela, setTela] = useState('criar'); // 'criar', 'setup', 'ranking', 'historico'

  return (
    <div className="app-container">
      <nav className="navbar">
        <button onClick={() => setTela('criar')}>🎲 Criar Mesa</button>
        <button onClick={() => setTela('ranking')}>🏆 Ranking</button>
        <button onClick={() => setTela('historico')}>📋 Histórico</button>
      </nav>

      <main>
        {tela === 'criar' && <CriarMesa />}
        {tela === 'ranking' && <Ranking />}
        {tela === 'historico' && <Historico />}
      </main>
    </div>
  );
}
```

### **3. Criar CSS**

```css
/* src/pages/Historico.css */
.historico-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.historico-container h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}
```

---

## 🔄 Padrões de Código

### **Tratamento de Erros**

```javascript
const confirmarAcao = async () => {
  setCarregando(true);
  setErro(null); // Sempre limpar erro anterior

  try {
    const resultado = await apiService.algumMetodo();
    setDados(resultado);
  } catch (error) {
    // Erro amigável para o usuário
    setErro(`⚠️ Erro: ${error.message}`);
    console.error('Erro técnico:', error); // Log para debug
  } finally {
    setCarregando(false); // Sempre limpar loading
  }
};
```

### **Chamada Assíncrona com useEffect**

```javascript
useEffect(() => {
  const buscarDados = async () => {
    try {
      setCarregando(true);
      const dados = await apiService.metodo();
      setDados(dados);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  buscarDados();
}, []); // Dependency array - quando deve rodar novamente?
```

### **Input com Autocomplete**

```javascript
const [valor, setValor] = useState('');
const [sugestoes, setSugestoes] = useState([]);

const handleChange = (e) => {
  const valor = e.target.value;
  setValor(valor);

  if (valor.length > 0) {
    // Filtrar sugestões
    const filtradas = lista.filter(item =>
      item.toLowerCase().includes(valor.toLowerCase())
    );
    setSugestoes(filtradas);
  } else {
    setSugestoes([]);
  }
};
```

---

## 📊 Estrutura de Dados (DTOs)

### **SetupRequest/Response** (já implementado)
```javascript
{
  "players": [
    { "id": 1, "name": "João" },
    { "id": 2, "name": "Maria" }
  ]
}

// Response:
{
  "groups": [
    [
      { "id": 1, "name": "João" },
      { "id": 3, "name": "Pedro" }
    ],
    [
      { "id": 2, "name": "Maria" },
      { "id": 4, "name": "Ana" }
    ]
  ]
}
```

### **Ranking Response** (já implementado)
```javascript
[
  {
    "id": 1,
    "name": "João",
    "points": 1500,
    "games": 10,
    "wins": 7
  },
  {
    "id": 2,
    "name": "Maria",
    "points": 1200,
    "games": 8,
    "wins": 5
  }
]
```

---

## 🧪 Testando Novo Endpoint

### **1. Teste direto (PowerShell)**

```powershell
# GET
curl http://localhost:8080/dashboard/ranking

# POST
$body = @{
    players = @(
        @{ id = 1; name = "João" },
        @{ id = 2; name = "Maria" }
    )
} | ConvertTo-Json

curl -Method POST `
  -Uri http://localhost:8080/api/setup/organize `
  -ContentType "application/json" `
  -Body $body
```

### **2. DevTools (F12) → Network**

1. Abra a página
2. Clique em "Network"
3. Execute ação que chama API
4. Veja requisição:
   - Request URL
   - Method (GET/POST)
   - Status (200/404/500)
   - Response body

### **3. Console (F12) → Console**

```javascript
// Teste na console mesmo
import apiService from './src/services/api.js'

// ⚠️ Só funciona se estiver rodando em dev
apiService.obterRanking().then(console.log).catch(console.error)
```

---

## 🚨 Debugging

### **Ativar logs verbose**

```javascript
// Adicione em api.js para ver cada requisição
export const apiService = {
  organizarMesas: async (jogadores) => {
    console.log('🔵 REQUEST:', `POST ${API_BASE_URL}/api/setup/organize`, jogadores);
    
    try {
      const response = await fetch(...);
      const data = await response.json();
      
      console.log('🟢 RESPONSE:', data);
      return data;
    } catch (error) {
      console.log('🔴 ERROR:', error);
      throw error;
    }
  }
};
```

### **Verificar Status da API**

```javascript
// Adicionar healthcheck em api.js
healthCheck: async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Usar no App.jsx:
useEffect(() => {
  apiService.healthCheck()
    .then(ok => console.log('Backend:', ok ? '✅ Online' : '❌ Offline'));
}, []);
```

---

## 🔐 Segurança & Boas Práticas

### ✅ **Fazer:**
- ✅ Validar dados do usuário antes de enviar
- ✅ Sanitizar inputs
- ✅ Usar HTTPS em produção
- ✅ Armazenar tokens em localStorage/sessionStorage
- ✅ Tratatar erros apropriadamente
- ✅ Usar variáveis de ambiente para URLs

### ❌ **Não fazer:**
- ❌ Expor senhas/tokens no código
- ❌ Confiar apenas em validação frontend
- ❌ Fazer requisições diretas da URL no navegador
- ❌ Logar informações sensíveis no console
- ❌ Usar HTTP em produção

---

## 📚 Recursos

| Recurso | Link |
|---------|------|
| React Docs | https://react.dev |
| Fetch API | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API |
| Spring Boot REST | https://spring.io/guides/gs/rest-service/ |
| Vite Proxy | https://vitejs.dev/config/server-options.html#server-proxy |

---

## ❓ Perguntas Frequentes

**P: Como adicionar autenticação?**
A: Adicione um método `login` em `api.js` que retorna um token. Armazene em localStorage e inclua no header `Authorization: Bearer token` de requisições autenticadas.

**P: Como fazer requisições em paralelo?**
```javascript
const [ranking, mesas] = await Promise.all([
  apiService.obterRanking(),
  apiService.obterMesas()
]);
```

**P: Como cancular requisições?**
Use `AbortController`:
```javascript
const controller = new AbortController();
fetch(url, { signal: controller.signal });
controller.abort(); // Cancela requisição
```

**P: Como fazer cache de dados?**
```javascript
const cache = {};

const obterComCache = async (chave, funcao) => {
  if (cache[chave]) return cache[chave];
  
  const dados = await funcao();
  cache[chave] = dados;
  return dados;
};
```

---

## 🎓 Próximos Passos

1. **Adicione seu primeiro endpoint** seguindo checklist acima
2. **Teste tudo** com DevTools (F12)
3. **Leia o código existente** (api.js, Ranking.jsx)
4. **Reutilize padrões** que vê no código
5. **Compartilhe** suas features!

---

**Versão:** 1.0
**Última atualização:** 11 de Agosto de 2026
**Autor:** GitHub Copilot

Boa sorte, desenvolvedor! 🚀

