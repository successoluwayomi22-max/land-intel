@echo off
title Landintel Cloudflare Tunnel (HTTP/2)
echo ========================================================
echo   LANDINTEL - CLOUDFLARE PUBLIC TUNNEL
echo   Forwarding: http://127.0.0.1:3000
echo   Protocol: HTTP/2 (Persistent, drop-resistant)
echo ========================================================
echo.
if not exist "cloudflared.exe" (
    echo [ERROR] cloudflared.exe not found in current directory!
    pause
    exit /b 1
)

.\cloudflared.exe tunnel --protocol http2 --url http://127.0.0.1:3000
pause
