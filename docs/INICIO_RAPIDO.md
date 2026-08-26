# 🚀 INÍCIO RÁPIDO - Jogatina Frontend

> Integração com Backend ✅ COMPLETA

---

## ⚡ Em 5 Minutos

### **Terminal 1: Backend (Spring Boot)**
```powershell
cd C:\_developer\jogatina
./gradlew bootRun
```
✅ Aguarde: `Tomcat started on port(s): 8080`

### **Terminal 2: Frontend (React)**
```powershell
cd C:\_developer\frontend-jogatina
npm run dev
```
✅ Abra: http://localhost:5173

---

## 🧭 Navegação

```
┌─────────────────────────────────────┐
│  🎲 Criar Mesa  │  🏆 Ranking      │  ← Navbar
├─────────────────────────────────────┤
│                                     │
│   Página Principal                  │
│   (varia conforme seleção)          │
│                                     │
└─────────────────────────────────────┘
```

### **Fluxo: Criar Mesa → Setup → Mesas Organizadas**

1. **Preencha dados:**
   - 📅 Data
   - 🎲 Jogo (Root)
   - 👥 Quantidade (2-20)

2. **Adicione jogadores:**
   - Digite nome (autocomplete)
   - Mínimo 3 pessoas
   - Clique "Organizar Mesas"

3. **Backend organiza:**
   - Requisição: `POST /api/setup/organize`
   - Resposta: Mesas com jogadores distribuídos

4. **Visualize resultado:**
   - Mesas aparecem com divisão

---

## 🏆 Ranking

**Clique em "🏆 Ranking"**
- Tabela com todos os jogadores
- Requisição: `GET /dashboard/ranking`
- Mostra: Posição, Nome, Pontos, Partidas, Vitórias

---

## 🧪 Testes Rápidos

### Test 1: Organizar Mesas (API POST)
```
✅ Ir para: Criar Mesa
✅ Preencher dados
✅ Ir para: Setup Mesa
✅ Adicionar 3+ jogadores
✅ Clicar: Organizar Mesas
→ Resultado: Mesas aparecem (ou erro se backend offline)
```

**DevTools (F12) → Network → Procure por `/api/setup/organize`**

### Test 2: Ver Ranking (API GET)
```
✅ Clicar: 🏆 Ranking
→ Resultado: Tabela com jogadores (pode estar vazia se sem dados)
```

**DevTools → Network → Procure por `/dashboard/ranking`**

---

## ❌ Se Não Funcionar...

### Erro: "Falha ao conectar com o servidor"
```
1. Verifique se backend está rodando:
   http://localhost:8080/dashboard/ranking
   
2. Abra DevTools (F12) → Console
   Procure por erro de conexão
   
3. Verifique firewall
```

### Erro: CORS
```
Backend precisa adicionar CorsConfig.kt
(Ver CHECKLIST.md → Troubleshooting → CORS Error)
```

### Erro: npm install falha
```powershell
npm cache clean --force
npm install
```

---

## 📁 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `src/services/api.js` | ⭐ Serviço de API (USE ESTE!) |
| `src/pages/Ranking.jsx` | Página de Ranking |
| `.env` | Config de URL da API |
| `vite.config.js` | Proxy para /api → :8080 |
| `INTEGRACAO.md` | Doc completa |
| `CHECKLIST.md` | Troubleshooting |

---

## 💡 Usar a API em Novo Código

```javascript
// Em qualquer componente:
import apiService from '../services/api.js';

// Organizar mesas:
const resultado = await apiService.organizarMesas(jogadores);

// Get Ranking:
const ranking = await apiService.obterRanking();

// Get Player Ranking:
const playerRank = await apiService.obterRankingJogador(playerId);
```

---

## 📝 Próximos Passos

- [ ] Teste a integração (veja "Testes Rápidos")
- [ ] Verifique console e network (F12)
- [ ] Leia `INTEGRACAO.md` para detalhes
- [ ] Configure Backend CORS se necessário
- [ ] Comece a adicionar features!

---

## 🎯 Checklist Rápido

- [x] Backend rodando em :8080?
- [x] PostgreSQL rodando?
- [x] npm install executado?
- [x] Frontend rodando em :5173?
- [x] Navbar aparece?
- [x] Organizar Mesas retorna resultado?
- [x] Ranking carrega dados?

---

## 📞 Documentação Completa

- **RESUMO.md** - Overview geral
- **INTEGRACAO.md** - Como integrar e usar
- **CHECKLIST.md** - Troubleshooting detalhado
- **INICIO_RAPIDO.md** - Este arquivo

---

**Status:** ✅ Pronto para uso
**Última atualização:** 11 de Agosto de 2026

Boa sorte! 🚀

