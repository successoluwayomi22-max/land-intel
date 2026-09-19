@echo off
title Landintel Next.js Server (2GB Heap)
echo ========================================================
echo   LANDINTEL - GLOBAL PROPERTY DUE-DILIGENCE PLATFORM
echo   Setting NODE_OPTIONS=--max-old-space-size=2048
echo   Starting development server on http://localhost:3000
echo ========================================================
echo.
set NODE_OPTIONS=--max-old-space-size=2048
npm run dev
pause
