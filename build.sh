#!/bin/bash
echo "==> Moving to dailyowo-web directory"
cd dailyowo-web

echo "==> Installing dependencies"
npm install

echo "==> Building the application"
npm run build

echo "==> Build completed successfully"