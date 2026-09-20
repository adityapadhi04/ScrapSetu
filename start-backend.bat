@echo off
REM ScrapSetu — Start Payment Backend (Windows)
REM Run this from the project root: ScrapSetu\

echo ========================================
echo  ScrapSetu Payment Backend
echo  Cashfree Sandbox Integration
echo ========================================
echo.

REM Check for .env file
if not exist backend\.env (
    echo [ERROR] backend\.env not found!
    echo.
    echo Please copy backend\.env.example to backend\.env
    echo and fill in your Cashfree Sandbox credentials.
    echo.
    echo  1. Go to: https://merchant.cashfree.com/merchants/login
    echo  2. Navigate to: Developers ^> API Keys ^> Test ^(Sandbox^)
    echo  3. Copy your Client ID and Client Secret
    echo  4. Paste them into backend\.env
    echo.
    pause
    exit /b 1
)

REM Check Python
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.9+
    pause
    exit /b 1
)

REM Install dependencies if not present
echo Checking Python dependencies...
pip show fastapi >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Installing backend dependencies...
    pip install -r backend\requirements.txt
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo.
echo Starting FastAPI backend on http://localhost:8000
echo API docs: http://localhost:8000/api/docs
echo Health:   http://localhost:8000/api/health
echo.
echo [Press Ctrl+C to stop]
echo.

python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
