@echo off
echo Starting Backend...
start "Backend Server" cmd /k "cd backend && npm install && npm run dev"

echo Starting Frontend...
start "Frontend Server" cmd /k "npm install && npm run dev"

echo Servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
