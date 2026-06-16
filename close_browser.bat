@echo off
title Close Web Browsers
color 0E
echo =================================================================
echo             ⚡ WARNING: Terminating Web Browsers ⚡
echo =================================================================
echo.
echo This utility will forcefully close all instances of:
echo   - Google Chrome (chrome.exe)
echo   - Microsoft Edge (msedge.exe)
echo   - Mozilla Firefox (firefox.exe)
echo.
color 0C
echo Terminating browser processes...

:: Terminate Google Chrome
taskkill /f /im chrome.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo   [+] Closed Google Chrome successfully.
)

:: Terminate Microsoft Edge
taskkill /f /im msedge.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo   [+] Closed Microsoft Edge successfully.
)

:: Terminate Mozilla Firefox
taskkill /f /im firefox.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo   [+] Closed Mozilla Firefox successfully.
)

color 0A
echo.
echo [SUCCESS] All target browser processes have been closed!
echo.
echo =================================================================
