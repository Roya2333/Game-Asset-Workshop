@echo off
chcp 65001 >nul
setlocal
set "MANAGEMENT_NODE=node"
where node.exe >nul 2>nul
if errorlevel 1 (
  set "MANAGEMENT_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)
"%MANAGEMENT_NODE%" --version >nul 2>nul
if errorlevel 1 (
  echo 未找到 Node.js。请从 https://nodejs.org/ 安装 Node.js 22 或更新版本后重试。
  pause
  exit /b 1
)
"%MANAGEMENT_NODE%" "%~dp0install.mjs" %*
set "MANAGEMENT_EXIT=%ERRORLEVEL%"
echo.
pause
exit /b %MANAGEMENT_EXIT%
