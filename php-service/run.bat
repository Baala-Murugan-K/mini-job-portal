@echo off
title PHP Upload Service (Port 8000)
where php >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting native PHP built-in server on http://127.0.0.1:8000...
    php -S 127.0.0.1:8000
) else (
    echo PHP binary not found in PATH.
    echo Launching Zero-Dependency PHP Emulator (Node.js) on http://127.0.0.1:8000...
    node php-server.js
)
pause
