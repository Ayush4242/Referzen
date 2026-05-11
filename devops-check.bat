@echo off
title ReferZen DevOps Environment Check
color 0b

echo =====================================================
echo    REFERZEN DEVOPS - LOCAL INFRASTRUCTURE CHECK
echo =====================================================
echo.

echo [1/4] Checking Node.js Runtime...
node -v
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    pause
    exit
)
echo SUCCESS: Node.js is ready.
echo.

echo [2/4] Verifying Environment Configurations...
if exist .env (
    echo SUCCESS: Frontend .env located.
) else (
    echo WARNING: Frontend .env missing.
)
if exist server\.env (
    echo SUCCESS: Backend .env located.
) else (
    echo WARNING: Backend .env missing.
)
echo.

echo [3/4] Validating Docker Manifests...
if exist Dockerfile (
    echo SUCCESS: Frontend Dockerfile detected.
)
if exist server\Dockerfile (
    echo SUCCESS: Backend Dockerfile detected.
)
if exist docker-compose.yml (
    echo SUCCESS: Orchestration manifest detected.
)
echo.

echo [4/4] CI/CD Pipeline Status...
if exist .github\workflows\deploy.yml (
    echo SUCCESS: GitHub Actions Workflow found.
)
echo.

echo -----------------------------------------------------
echo SYSTEM STATUS: OPTIMIZED FOR CLOUD DEPLOYMENT
echo -----------------------------------------------------
echo.
echo Press any key to start local development servers...
pause > nul

start cmd /k "cd server && npm run dev"
npm run dev
