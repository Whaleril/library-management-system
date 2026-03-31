@echo off
start "Backend" cmd /k "cd backend && npm run dev"
start "Frontend" cmd /k "cd frontend && npm run dev"
echo 前后端已启动，关闭窗口即可停止