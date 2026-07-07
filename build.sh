#!/bin/bash
# Exit on error
set -e

echo "Building frontend..."
cd frontend_v2
npm install --legacy-peer-deps
npm run build
cd ..

echo "Copying build into backend..."
rm -rf app/frontend_dist
cp -r frontend_v2/dist/public app/frontend_dist

echo "Done. app/frontend_dist is ready to commit and deploy."
