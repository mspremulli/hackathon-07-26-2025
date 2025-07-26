#!/bin/bash

echo "🚀 Starting Engineer #2 - Bright Data Review Scraper"
echo "=================================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check for Bright Data customer ID
if grep -q "your_customer_id_here" .env; then
    echo "⚠️  WARNING: Please add your BRIGHT_DATA_CUSTOMER_ID to .env"
    echo "   You can get this from the Bright Data booth or Discord"
    echo ""
fi

echo "🧪 Running comprehensive demo..."
echo ""

# Run the comprehensive analysis demo
npx ts-node src/demo/comprehensive-analysis.ts

echo ""
echo "✅ Demo complete!"
echo ""
echo "📊 Other available tests:"
echo "   npm run test:reviews   - Test app store reviews only"
echo "   npm run test:social    - Test social media monitoring"
echo "   npm run test:demo      - Run full test suite"
echo ""
echo "🔗 Integration test:"
echo "   npx ts-node src/integration/orkes-worker.ts"