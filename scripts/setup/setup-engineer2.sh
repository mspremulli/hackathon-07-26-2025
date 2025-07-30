#!/bin/bash

echo "🚀 Setting up Engineer #2 - Bright Data Review Scraping"

# Install dependencies
echo "📦 Installing dependencies..."
npm init -y
npm install axios dotenv typescript @types/node ts-node

# Create TypeScript config
echo "⚙️ Creating TypeScript configuration..."
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create .env.example
echo "🔐 Creating .env.example..."
cat > .env.example << EOF
# Bright Data credentials (get from hackathon Discord/booth)
BRIGHT_DATA_API_KEY=your_api_key_here
BRIGHT_DATA_CUSTOMER_ID=your_customer_id_here

# Optional: For integration with other engineers
ORKES_API_KEY=
ORKES_SERVER_URL=
EOF

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file - please add your Bright Data credentials"
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your Bright Data credentials to .env file"
echo "2. Run: npm run test:scraper"
echo "3. Check the results in the console"
echo ""
echo "📚 Documentation:"
echo "- Bright Data MCP: https://github.com/brightdata/brightdata-mcp"
echo "- Your scraper is in: src/agents/review-scraper-agent.ts"