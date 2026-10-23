@echo off
rem Dois cliques rodam o instalador do Style Studio no Windows (sem precisar do Claude).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar.ps1"
pause
