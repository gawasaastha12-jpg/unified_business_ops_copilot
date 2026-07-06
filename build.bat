@echo off
echo Building frontend...
cd frontend_v1
call npm install
call npm run build
cd ..

echo Copying build into backend...
if exist app\frontend_dist (
    rmdir /s /q app\frontend_dist
)
xcopy /E /I /Y frontend_v1\dist\public app\frontend_dist

echo Done. app\frontend_dist is ready to commit and deploy.
