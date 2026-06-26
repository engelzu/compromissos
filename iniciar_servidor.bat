@echo off
title Servidor Local - Sistema de Compromissos
echo ======================================================
echo   Iniciando o Servidor Local na porta 8080...
echo ======================================================
echo.
echo Abrindo o navegador em http://localhost:8080...
start "" "http://localhost:8080"
echo.
echo Pressione Ctrl+C para encerrar o servidor.
echo.
python -m http.server 8080
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERRO] Nao foi possivel iniciar com o Python. Tentando via npx serve...
    npx serve -l 8080
)
pause
