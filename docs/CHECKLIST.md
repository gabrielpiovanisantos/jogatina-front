# ✅ Checklist de Integração - Jogatina Frontend

## 📋 Status da Integração

### ✅ Implementação Completa

#### Arquivos Criados:
- [x] `src/services/api.js` - Serviço centralizado de API
- [x] `src/pages/Ranking.jsx` - Página de ranking
- [x] `src/pages/Ranking.css` - Estilos do ranking
- [x] `.env` - Variáveis de ambiente
- [x] `INTEGRACAO.md` - Documentação detalhada
- [x] `dev.bat` - Script de desenvolvimento
- [x] `CHECKLIST.md` - Este arquivo

#### Arquivos Modificados:
- [x] `src/App.jsx` - Adicionada navegação e página Ranking
- [x] `src/pages/SetupMesa.jsx` - Integração com API service
- [x] `src/App.css` - Estilos da navbar
- [x] `vite.config.js` - Proxy para API backend

---

## 🚀 Como Começar

### 1. Pré-requisitos

#### Backend (Jogatina - Spring Boot)
```powershell
cd C:\_developer\jogatina
./gradlew bootRun
```

Esperado:
- ✅ Rodando em `http://localhost:8080`
- ✅ PostgreSQL conectado em `localhost:5432`
- ✅ Database `root_jogatina` criada

#### Frontend (React + Vite)
```powershell
cd C:\_developer\frontend-jogatina
npm install  # Primeira vez apenas
npm run dev  # Ou execute dev.bat
```

Esperado:
- ✅ Rodando em `http://localhost:5173`
- ✅ Proxy configurado para `/api` → `http://localhost:8080/api`

### 2. Testes Básicos

#### Test 1: Verificar Conectividade
1. Abra DevTools (F12)
2. Va para aba "Network"
3. Clique em "🎲 Criar Mesa"
4. Preencha: Data, Jogo (Root), Quantidade (6)
5. Clique "Confirmar e Continuar"
6. Aumente quantidade de jogadores (pelo menos 3)
7. Clique "Organizar Mesas"
8. Verifique em Network se houve requisição para `/api/setup/organize`

**Resultado esperado:** ✅ Mesas organizadas com divisão dos jogadores

#### Test 2: Verificar Ranking
1. Clique em "🏆 Ranking" na navbar
2. Aguarde carregamento
3. Verifique em Network se houve requisição para `/dashboard/ranking`

**Resultado esperado:** ✅ Tabela de ranking aparecer (pode estar vazia se não há dados)

### 3. Troubleshooting

#### ❌ "Falha ao conectar com o servidor"
**Solução:**
1. Verifique se backend está rodando: `http://localhost:8080`
2. Verifique console (DevTools → Console) para ver erro específico
3. Verifique aba Network para ver status das requisições
4. Verifique firewall

#### ❌ CORS Error
**Solução:**
Se receber erro de CORS no console, configure o backend adicionando um arquivo `CorsConfig.kt`:

```kotlin
package com.gabriel.jogatina.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
class CorsConfig {
    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val config = CorsConfiguration()
        config.allowedOrigins = listOf("http://localhost:5173", "http://localhost:3000")
        config.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
        config.allowedHeaders = listOf("*")
        config.allowCredentials = true
        config.maxAge = 3600
        
        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)
        return source
    }
}
```

#### ❌ Database Connection Error
**Solução:**
1. Verifique se PostgreSQL está rodando
2. Verifique credenciais em `application.yaml`:
   ```yaml
   datasource:
     url: jdbc:postgresql://localhost:5432/root_jogatina
     username: root_admin
     password: root_password
   ```
3. Crie a database se não existir:
   ```sql
   CREATE DATABASE root_jogatina;
   ```

#### ❌ npm install falha
**Solução:**
```powershell
# Limpar cache
npm cache clean --force

# Tentar novamente
npm install

# Se ainda falhar, remover node_modules
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 🔗 Endpoints Integrados

| Método | Endpoint | Status | Teste |
|--------|----------|--------|-------|
| POST | `/api/setup/organize` | ✅ Implementado | "Organizar Mesas" button |
| GET | `/dashboard/ranking` | ✅ Implementado | "🏆 Ranking" page |
| GET | `/dashboard/ranking/{id}` | ✅ Pronto para usar | Futuro |

---

## 📁 Estrutura de Arquivos

```
frontend-jogatina/
├── .env                      # Variáveis de ambiente
├── vite.config.js            # Config do Vite com proxy
├── dev.bat                   # Script de desenvolvimento
├── INTEGRACAO.md             # Documentação detalhada
├── CHECKLIST.md              # Este arquivo
├── package.json
├── src/
│   ├── App.jsx               # Main app com navegação
│   ├── App.css               # Estilos (navbar adicionada)
│   ├── services/
│   │   └── api.js            # ✨ Novo: Serviço de API
│   └── pages/
│       ├── CriarMesa.jsx
│       ├── SetupMesa.jsx      # Atualizado: usa api.js
│       ├── Ranking.jsx        # ✨ Novo: Página de ranking
│       └── Ranking.css        # ✨ Novo: Estilos ranking
└── public/
```

---

## 🎯 Próximos Passos (Recomendados)

1. **Usar API Real para Players**
   - Criar endpoint `/api/players` no backend
   - Atualizar autocomplete para buscar do backend

2. **Salvar Partidas**
   - Criar endpoint `/api/games` para salvar resultado
   - Integrar em SetupMesa após organizar mesas

3. **Histórico de Partidas**
   - Criar página com histórico
   - Endpoints GET `/api/games` ou `/api/games/{playerId}`

4. **Autenticação**
   - Adicionar login de usuários
   - JWT tokens para autenticação

5. **Melhorias UI/UX**
   - Dark mode
   - Responsividade mobile
   - Animações mais fluidas
   - Notificações/Toast messages

---

## 📞 Support

Se encontrar problemas:

1. **Verificar logs do backend:**
   ```
   Terminal onde backend está rodando → procure por erros
   ```

2. **Verificar logs do frontend:**
   ```
   DevTools (F12) → Console → procure por erros
   DevTools → Network → verifique requisições
   ```

3. **Testar endpoints diretamente:**
   ```powershell
   # PowerShell
   curl http://localhost:8080/dashboard/ranking
   curl -X POST http://localhost:8080/api/setup/organize `
     -ContentType "application/json" `
     -Body '{
       "players": [
         {"id": 1, "name": "João"},
         {"id": 2, "name": "Maria"},
         {"id": 3, "name": "Pedro"}
       ]
     }'
   ```

---

**Status:** ✅ Integração Completa
**Data:** Agosto 2026
**Autor:** GitHub Copilot

