@echo off
echo Building frontend...
cd frontend_v2
call npm install --legacy-peer-deps
call npm run build
cd ..

echo Copying build into backend...
if exist app\frontend_dist (
    rmdir /s /q app\frontend_dist
)
xcopy /E /I /Y frontend_v2\dist\public app\frontend_dist

echo Done. app\frontend_dist is ready to commit and deploy.
