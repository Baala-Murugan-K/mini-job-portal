@echo off
title Mini Job Portal - Orchestrator
echo ====================================================================
echo Starting Mini Job Portal (All 4 Services)
echo ====================================================================

echo 1. Starting PHP Service (Port 8000)...
start "PHP Upload Service :8000" cmd /c "cd php-service && run.bat"

echo 2. Starting Python Matching Service (Port 5001)...
start "Python Matcher :5001" cmd /c "cd python-service && run.bat"

echo 3. Starting Express Core API with MongoDB Atlas (Port 5000)...
start "Express Backend :5000" cmd /c "cd server && run.bat"

echo 4. Starting React Client (Port 3000)...
start "React Client :3000" cmd /c "cd client && npm run dev"

echo.
echo ====================================================================
echo All 4 services have been launched in separate terminal windows!
echo - React Frontend:  http://localhost:3000
echo - Express Backend: http://127.0.0.1:5000
echo - Python Matcher:  http://127.0.0.1:5001
echo - PHP Upload:      http://127.0.0.1:8000
echo ====================================================================
pause
