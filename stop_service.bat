@echo off
title Stop Dubplitube Companion Server
color 0C
echo =================================================================
echo             ⚡ Stopping Dubplitube Companion Server ⚡
echo =================================================================
echo.

echo Searching for processes running on port 5000...
set "pid="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do set "pid=%%a"

if defined pid (
    echo Found Dubplitube Companion running on PID %pid%!
    echo Terminating server process...
    taskkill /f /pid %pid% >nul 2>&1
    if %errorlevel% equ 0 (
        color 0A
        echo.
        echo [SUCCESS] Dubplitube Companion Server has been stopped successfully!
    ) else (
        echo [ERROR] Failed to stop the process. You may need to run this batch file as Administrator.
    )
) else (
    color 0E
    echo [INFO] No active Dubplitube Companion Server detected on port 5000.
    echo It is already stopped or not running.
)

echo.
echo =================================================================
