# 🎲 Integração Frontend Jogatina com Backend

## ✅ O que foi implementado

### 1. **Serviço de API Centralizado** (`src/services/api.js`)
- Centraliza todas as chamadas HTTP para o backend
- Métodos disponíveis:
  - `organizarMesas(jogadores)` - POST para `/api/setup/organize`
  - `obterRanking()` - GET para `/dashboard/ranking`
  - `obterRankingJogador(playerId)` - GET para `/dashboard/ranking/{playerId}`

### 2. **Página de Ranking** (`src/pages/Ranking.jsx`)
- Exibe todos os jogadores e suas posições no ranking
- Integrada com o endpoint `/dashboard/ranking`
- Accessible através da navbar de navegação

### 3. **Navegação Melhorada** (App.jsx)
- Adicionada navbar com navegação entre seções
- 3 telas principais: **Criar Mesa**, **Setup Mesa** e **Ranking**

### 4. **Configuração de Ambiente** (`.env`)
- Variável `VITE_API_URL` para configurar a URL do backend
- Permite mudar a URL facilmente sem editar código

### 5. **SetupMesa.jsx Atualizado**
- Agora usa o serviço de API centralizado
- `USAR_API_BACKEND = true` (habilitado)
- Chamadas mais limpas e com melhor tratamento de erros

---

## 🚀 Como Usar

### **Pré-requisitos**

1. **Backend rodando** (Spring Boot em `http://localhost:8080`)
   ```bash
   cd C:\_developer\jogatina
   # Build e execute o projeto Spring Boot
   ./gradlew bootRun
   ```

2. **PostgreSQL rodando** (conforme configurado em `application.yaml`)
   ```yaml
   url: jdbc:postgresql://localhost:5432/root_jogatina
   username: root_admin
   password: root_password
   ```

### **Iniciar o Frontend**

```bash
cd C:\_developer\frontend-jogatina

# Instalar dependências (primeira vez)
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em: `http://localhost:5173`

---

## 📋 Fluxo de Uso

### **1️⃣ Criar Mesa**
- Preencha a data, jogo e quantidade de pessoas
- Confirme os dados

### **2️⃣ Setup Mesa**
- Adicione os jogadores através do input
- O sistema autocomplete com nomes da lista mock (ou futura API)
- Clique em "Organizar Mesas"
- **O backend recebe a lista de jogadores e retorna as mesas organizadas**

### **3️⃣ Ver Ranking**
- Clique em "🏆 Ranking" na navbar
- Sistema carrega dados do endpoint `/dashboard/ranking`
- Exibe posição, nome, pontos, partidas e vitórias de cada jogador

---

## 🔧 Variáveis de Ambiente

O `.env` é local e não vai para o git. O modelo versionado é o `.env.example`;
na primeira vez, copie-o (`cp .env.example .env`) e ajuste:

```env
VITE_API_URL=/          # relativo: passa pelo proxy do Vite (dev) e do nginx (Docker)
VITE_USE_MOCK=false     # sem esta linha, a interface usa dados mockados
```

Para mudar o endereço do backend no desenvolvimento, use a variável `BACKEND_URL`
do `vite.config.js` (alvo do proxy) e reinicie o desenvolvimento. A imagem Docker
não lê o `.env`: as variáveis do Vite são definidas no `Dockerfile`.

---

## 📁 Arquivos Criados/Modificados

### ✨ Novos Arquivos:
- `src/services/api.js` - Serviço de API centralizado
- `src/pages/Ranking.jsx` - Página de ranking
- `src/pages/Ranking.css` - Estilos do ranking
- `.env` - Configuração de ambiente

### 📝 Modificados:
- `src/App.jsx` - Adicionada navegação e página de ranking
- `src/pages/SetupMesa.jsx` - Integrada com o serviço de API
- `src/App.css` - Adicionados estilos da navbar

---

## 🐛 Troubleshooting

### ❌ "Falha ao conectar com o servidor"
- Verifique se o backend está rodando em `http://localhost:8080`
- Abra o DevTools (F12) → Network para ver os erros de requisição
- Verifique a URL em `.env`

### ❌ CORS Error
Se receber erro de CORS, configure o backend adicionando:

```kotlin
// Em um novo arquivo CorsConfig.kt
@Configuration
class CorsConfig {
    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val config = CorsConfiguration()
        config.allowedOrigins = listOf("http://localhost:5173")
        config.allowedMethods = listOf("GET", "POST", "PUT", "DELETE")
        config.allowedHeaders = listOf("*")
        config.allowCredentials = true
        
        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)
        return source
    }
}
```

### ❌ Base de dados sem dados
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais em `application.yaml`
- Verifique se a database `root_jogatina` existe

---

## 🔗 Endpoints Utilizados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/setup/organize` | Organiza jogadores em mesas |
| GET | `/dashboard/ranking` | Retorna ranking de todos |
| GET | `/dashboard/ranking/{playerId}` | Retorna ranking de um jogador |

---

## 📚 Documentação do Código

### Usando o apiService

```javascript
import apiService from '../services/api.js';

// Organizar mesas
try {
  const resultado = await apiService.organizarMesas([
    { id: 1, name: 'João' },
    { id: 2, name: 'Maria' }
  ]);
  console.log(resultado.groups); // Array de mesas
} catch (error) {
  console.error(error);
}

// Obter ranking
const ranking = await apiService.obterRanking();

// Obter ranking de um jogador
const jogador = await apiService.obterRankingJogador(1);
```

---

## 🎨 Personalizações Futuras

- Adicionar autenticação de usuários
- Salvar histórico de partidas
- Integrar mais endpoints do backend
- Criar página de histórico de partidas
- Adicionar temas (dark mode)
- Responsividade mobile melhorada

---

**Última atualização:** Agosto 2026

