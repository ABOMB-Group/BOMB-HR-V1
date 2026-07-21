@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8080/app/"
  start "" "http://localhost:8080/admin/dashboard.html"
  py -m http.server 8080
) else (
  start "" "http://localhost:8080/app/"
  start "" "http://localhost:8080/admin/dashboard.html"
  python -m http.server 8080
)
