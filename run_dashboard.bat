@echo off
title MTA Traffic Dashboard
echo =========================================
echo MTA Traffic Intelligence Dashboard
echo =========================================

:: Go to the directory where the batch file is located
cd /d "%~dp0"

echo Activating virtual environment...
if exist ".venv\Scripts\activate.bat" (
    call ".venv\Scripts\activate.bat"
) else (
    echo [WARNING] Virtual environment not found at .venv\Scripts\activate.bat. Using global python...
)

echo.
echo Opening your browser in 3 seconds...
:: Run a background powershell command to open the browser after a short delay
start /B powershell -command "Start-Sleep -s 3; Start-Process 'http://127.0.0.1:8000'"

echo.
echo Starting FastAPI server...
echo Press Ctrl+C to stop the server and close this window.
cd backend
python main.py
