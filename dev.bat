@echo off
REM Script para iniciar o desenvolvimento do Jogatina Frontend
REM Este script verifica pré-requisitos e inicia o servidor de desenvolvimento

echo.
echo ========================================
echo   🎲 JOGATINA FRONTEND - DEV SERVER
echo ========================================
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js não está instalado ou não está no PATH
    echo Baixe em: https://nodejs.org/
    exit /b 1
)

echo ✅ Node.js encontrado
node --version

REM Verificar se npm está instalado
where npm >nul 2>nul
if errorlevel 1 (
    echo ❌ npm não está instalado
    exit /b 1
)

echo ✅ npm encontrado
npm --version
echo.

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    call npm install
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependências
        exit /b 1
    )
    echo ✅ Dependências instaladas
    echo.
)

REM Avisar sobre o backend
echo ⚠️  IMPORTANTE:
echo    Certifique-se de que o backend está rodando em http://localhost:8080
echo    - PostgreSQL: localhost:5432 (root_jogatina)
echo    - Backend: http://localhost:8080
echo.
echo    Se o backend não estiver rodando, execute em outro terminal:
echo    cd C:\_developer\jogatina
echo    gradlew bootRun
echo.

REM Iniciar o servidor de desenvolvimento
echo 🚀 Iniciando servidor de desenvolvimento...
echo    Frontend: http://localhost:5173
echo    API Proxy: /api -> http://localhost:8080/api
echo.
call npm run dev

echo.
if errorlevel 1 (
    echo ❌ Erro ao iniciar o servidor
    exit /b 1
)

