@echo off
chcp 65001 >nul
cd /d "C:\Users\hitum\Desktop\WEB\新しいフォルダー"

echo Starting local server...
start http://localhost:8000/

python -m http.server 8000

pause