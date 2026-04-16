@echo off
echo Starting local music server...
echo ---------------------------------------
echo.
start "" "http://localhost:8000"
python -m http.server 8000
pause
