@echo off
echo ========================================
echo Mental Health Assessment Tool
echo ========================================
echo.
echo Installing dependencies...
pip install -r requirements.txt
echo.
echo Starting the application...
echo.
echo The app will be available at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
python app.py
pause


