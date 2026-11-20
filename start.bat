@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Smart Shield
where node >nul 2>nul || (echo Node.js is not installed. Install it from https://nodejs.org & pause & exit /b)
set PORT=8787
start "Smart Shield - Server" cmd /k node server.js
set CF=cloudflared
where cloudflared >nul 2>nul || (
  if exist "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" (set "CF=%ProgramFiles(x86)%\cloudflared\cloudflared.exe") else if exist "%ProgramFiles%\cloudflared\cloudflared.exe" (set "CF=%ProgramFiles%\cloudflared\cloudflared.exe") else (
    echo Installing cloudflared...
    winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements
    if exist "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" set "CF=%ProgramFiles(x86)%\cloudflared\cloudflared.exe"
    if exist "%ProgramFiles%\cloudflared\cloudflared.exe" set "CF=%ProgramFiles%\cloudflared\cloudflared.exe"
  )
)
timeout /t 2 >nul
start "Smart Shield - HTTPS link" cmd /k ""%CF%" tunnel --url http://localhost:8787"
echo.
echo The HTTPS link (https://....trycloudflare.com) appears in the "HTTPS link" window.
echo Open it on both phones. Keep both windows open during the demo.
pause
