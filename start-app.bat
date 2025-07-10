@echo off
echo Starting CodeCollab Application...
echo.

echo Checking if Node.js is installed...
node --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed. Please install Node.js and try again.
    pause
    exit /b 1
)

echo Checking backend dependencies...
cd C:\Users\Mayan\Desktop\soen-main\backend
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)

echo Checking frontend dependencies...
cd C:\Users\Mayan\Desktop\soen-main\frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

echo.
echo Starting Backend Server...
start cmd /k "cd C:\Users\Mayan\Desktop\soen-main\backend && npm run dev"

echo Waiting for backend to start...
ping 127.0.0.1 -n 5 > nul

echo.
echo Starting Frontend...
start cmd /k "cd C:\Users\Mayan\Desktop\soen-main\frontend && npm run dev"

echo.
echo Both servers should be starting in separate windows.
echo Backend: http://localhost:3000
echo Frontend: Check the output in the frontend window for the URL (likely http://localhost:5173 or http://localhost:5174)
echo.
echo Press any key to exit this window...
pause > nul 