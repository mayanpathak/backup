@echo off
echo CodeCollab Server Diagnostic Tool
echo =================================
echo.

echo Checking if backend server is running...
curl -s -o nul -w "%%{http_code}" http://localhost:3000 > temp.txt
set /p STATUS=<temp.txt
del temp.txt

if "%STATUS%"=="200" (
    echo [SUCCESS] Backend server is running at http://localhost:3000
) else (
    echo [ERROR] Backend server is not responding at http://localhost:3000
    echo.
    echo Possible issues:
    echo 1. Backend server is not running
    echo 2. Backend server is running on a different port
    echo 3. There's a network or firewall issue
    echo.
    echo Try running the following command in a new terminal:
    echo cd C:\Users\Mayan\Desktop\soen-main\backend ^&^& npm run dev
)

echo.
echo Checking Redis connection...
cd C:\Users\Mayan\Desktop\soen-main\backend
node -e "const redis = require('ioredis'); const client = new redis({ host: process.env.REDIS_HOST || 'localhost', port: process.env.REDIS_PORT || 6379, password: process.env.REDIS_PASSWORD || '' }); client.ping().then(res => { console.log('[SUCCESS] Redis connection successful'); process.exit(0); }).catch(err => { console.error('[ERROR] Redis connection failed:', err.message); process.exit(1); });" > nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Redis connection appears to be working
) else (
    echo [ERROR] Redis connection test failed
    echo.
    echo Possible issues:
    echo 1. Redis server is not running
    echo 2. Redis connection settings in .env are incorrect
    echo 3. Network or firewall issues
)

echo.
echo Checking MongoDB connection...
cd C:\Users\Mayan\Desktop\soen-main\backend
node -e "const mongoose = require('mongoose'); require('dotenv').config(); mongoose.connect(process.env.MONGO_URI).then(() => { console.log('[SUCCESS] MongoDB connection successful'); mongoose.disconnect(); process.exit(0); }).catch(err => { console.error('[ERROR] MongoDB connection failed:', err.message); process.exit(1); });" > nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] MongoDB connection appears to be working
) else (
    echo [ERROR] MongoDB connection test failed
    echo.
    echo Possible issues:
    echo 1. MongoDB credentials in .env may be incorrect
    echo 2. Network or firewall issues
    echo 3. MongoDB service might be down
)

echo.
echo Checking frontend configuration...
cd C:\Users\Mayan\Desktop\soen-main\frontend
if exist ".env.local" (
    echo [INFO] Found .env.local file
    type .env.local | findstr "VITE_API_URL" > nul
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] VITE_API_URL is configured in .env.local
    ) else (
        echo [WARNING] VITE_API_URL not found in .env.local
        echo The API URL may be misconfigured
    )
) else (
    echo [WARNING] No .env.local file found
    echo Creating .env.local with default API URL...
    echo VITE_API_URL=http://localhost:3000 > .env.local
    echo [SUCCESS] Created .env.local with VITE_API_URL=http://localhost:3000
)

echo.
echo Diagnostic complete.
echo.
echo Press any key to exit...
pause > nul 