@echo off
echo ============================================
echo  RADIX Talent Match - Starting Backend
echo ============================================
cd /d "%~dp0backend"
venv\Scripts\uvicorn.exe main:app --reload --host 0.0.0.0 --port 8000
