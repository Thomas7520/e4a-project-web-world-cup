@echo off
echo Installation des dependances backend...
cd backend
npm install
cd ..

echo.
echo Installation des dependances frontend...
cd frontend
npm install
cd ..

echo.
echo Dependances installees. Vous pouvez lancer start-server.bat et start-frontend.bat
pause
