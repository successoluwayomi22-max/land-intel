@echo off
title LandIntel Local Server (http://localhost:3000)
echo ========================================================
echo   LANDINTEL - LOCAL DEVELOPMENT SERVER
echo   URL: http://localhost:3000
echo ========================================================
echo.
set NEXT_DISABLE_MEM_OVERRIDE=1
set NODE_OPTIONS=--max-old-space-size=1536
npm run dev
pause
