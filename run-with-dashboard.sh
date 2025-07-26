#!/bin/bash

echo "🚀 Starting COO/EIR Assistant with Dashboard"
echo "==========================================="

# Function to cleanup on exit
cleanup() {
    echo -e "\n🛑 Shutting down services..."
    kill $SCRAPER_PID $DASHBOARD_PID 2>/dev/null
    exit
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing main dependencies..."
    npm install
fi

if [ ! -d "dashboard/node_modules" ]; then
    echo "📦 Installing dashboard dependencies..."
    cd dashboard && npm install && cd ..
fi

# Start the main scraper/API service
echo -e "\n🔧 Starting Senso.ai Context OS & Scrapers (Port 3000)..."
npx ts-node src/demo/api-server.ts &
SCRAPER_PID=$!

# Give it a moment to start
sleep 3

# Start the dashboard
echo -e "\n🎨 Starting Dashboard (Port 3001)..."
cd dashboard && npm run dev &
DASHBOARD_PID=$!

# Wait for services to be ready
echo -e "\n⏳ Waiting for services to start..."
sleep 5

echo -e "\n✅ Services are running!"
echo "===================================="
echo "📊 Dashboard: http://localhost:3001"
echo "🔧 API Server: http://localhost:3000"
echo "===================================="
echo -e "\nPress Ctrl+C to stop all services\n"

# Keep the script running
wait