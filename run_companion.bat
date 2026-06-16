@echo off
title Dubplitube Companion Server
color 0B
echo =================================================================
echo             ⚡ Starting Dubplitube Companion Server ⚡
echo =================================================================
echo.
echo checking for Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Python is not installed or not added to your system PATH!
    echo Please install Python 3.x and ensure you check "Add Python to PATH".
    echo.
    pause
    exit /b
)

echo Python is detected! Starting server...
echo.
set PYTHONDONTWRITEBYTECODE=1
python -B companion_server.py
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Server exited with errors.
    pause
)
