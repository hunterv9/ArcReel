@echo off
TITLE ArcReel Development Environment
echo ==========================================
echo   ArcReel: Starting AI Video Workspace
echo ==========================================
echo.

:: 1. Backend Service
echo [1/2] Starting Backend on port 1241...
start "ArcReel Backend" cmd /k "echo Starting Backend... && uv run uvicorn server.app:app --port 1241"

:: 2. Frontend Service
echo [2/2] Starting Frontend on port 5173...
cd frontend
start "ArcReel Frontend" cmd /k "echo Starting Frontend... && pnpm run dev"

echo.
echo ==========================================
echo   All services are launching!
echo   - Backend: http://localhost:1241
echo   - Frontend: http://localhost:5173
echo ==========================================
echo.
pause
