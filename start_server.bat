@echo off
echo 네이버 지도 API 테스트 서버 시작
echo ==============================
echo 1. Python HTTP 서버 (포트 8000)
echo 2. Python CORS 지원 서버 (포트 8080)
echo 3. Node.js Express 서버 (포트 3000) - 설치 필요
echo 4. Python 네이버 API 프록시 서버 (포트 8000) - 추천
echo ==============================
set /p choice=실행할 서버 번호를 선택하세요 (1-4): 

if "%choice%"=="1" (
    echo Python 기본 HTTP 서버를 시작합니다...
    python -m http.server 8000
) else if "%choice%"=="2" (
    echo Python CORS 지원 서버를 시작합니다...
    python server.py 8080
) else if "%choice%"=="3" (
    echo Node.js Express 서버를 시작합니다...
    echo 필요한 패키지를 설치 중입니다...
    npm install
    npm start
) else if "%choice%"=="4" (
    echo Python 네이버 API 프록시 서버를 시작합니다...
    python server_with_api.py 8000
) else (
    echo 잘못된 선택입니다. 1, 2, 3, 4 중 하나를 선택하세요.
    pause
    exit /b
)
