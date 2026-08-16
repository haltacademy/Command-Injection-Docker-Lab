#!/usr/bin/env bash

echo "======================================================="
echo "  Halt Academy - OS Command Injection Lab Startup"
echo "======================================================="

# Check if Docker is available
if command -v docker-compose &> /dev/null; then
    DOCKER_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_CMD="docker compose"
else
    echo "[!] Docker Compose not found. Running with Node.js directly..."
    npm install
    npm start
    exit 0
fi

echo "[*] Building and starting Docker container..."
$DOCKER_CMD down --remove-orphans 2>/dev/null
$DOCKER_CMD up --build -d

echo "[✓] Lab successfully started in Docker!"
echo "[*] Access the Cyber Operations Lab Dashboard at: http://localhost:3000"
echo "======================================================="
