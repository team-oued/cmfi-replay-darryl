#!/bin/bash
echo "Starting Admin API Backend Server..."
cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "Starting server on port 3001..."
echo "Make sure you have configured server/.env with your Firebase Admin credentials"
echo ""
node index.js


