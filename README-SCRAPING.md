# Company Feedback Scraping Commands

## Quick Start

### 1. Interactive Mode (Prompts for Details)
```bash
npx ts-node src/scrape-company.ts
```
This will prompt you for:
- Company name
- iOS App Store ID (optional)
- Android app package name (optional)
- Location (default: San Francisco)

### 2. Quick Mode (Command Line)
```bash
# Scrape popular companies
npx ts-node src/scrape-company-quick.ts whatsapp
npx ts-node src/scrape-company-quick.ts uber
npx ts-node src/scrape-company-quick.ts airbnb
npx ts-node src/scrape-company-quick.ts spotify
npx ts-node src/scrape-company-quick.ts netflix

# Scrape any company (generic search)
npx ts-node src/scrape-company-quick.ts "OpenAI"
npx ts-node src/scrape-company-quick.ts "Tesla"
```

## MongoDB Storage

Feedback is automatically saved to MongoDB in company-specific collections:
- WhatsApp → `whatsapp-feedback`
- Uber → `uber-feedback`
- OpenAI → `openai-feedback`

## View Results in MongoDB

```bash
# Connect to MongoDB
mongosh "mongodb+srv://username:password@cluster.mongodb.net/hackathon-07-26-2025"

# View collections
show collections

# Query specific company feedback
db['whatsapp-feedback'].find().pretty()
db['uber-feedback'].find({ sentiment: 'negative' }).pretty()
db['openai-feedback'].find({ rating: { $lte: 2 } }).pretty()

# Get statistics
db['whatsapp-feedback'].countDocuments()
db['whatsapp-feedback'].aggregate([
  { $group: { 
    _id: "$sentiment", 
    count: { $sum: 1 },
    avgRating: { $avg: "$rating" }
  }}
])
```

## What Gets Scraped

The scraper attempts to collect feedback from:
- **App Store Reviews** (if iOS app ID provided)
- **Google Play Reviews** (if Android package name provided)
- **Reddit Discussions** (searches for company mentions)
- **GitHub Issues** (if company has public repos)
- **Social Media** (Twitter/X mentions)
- **Glassdoor Reviews** (employee feedback)
- **YouTube Comments** (on company videos)

Real data is scraped where possible via Bright Data, with fallback to mock data.

## Pre-configured Companies

The quick scraper has these companies pre-configured:
- **whatsapp**: App Store ID 310633997, Package com.whatsapp
- **uber**: App Store ID 368677368, Package com.ubercab
- **airbnb**: App Store ID 401626263, Package com.airbnb.android
- **spotify**: App Store ID 324684580, Package com.spotify.music
- **netflix**: App Store ID 363590051, Package com.netflix.mediaclient

## Example Output

```
🚀 Starting scraper for: WhatsApp
📍 Configuration: {
  appStore: 310633997
  googlePlay: com.whatsapp
  location: Menlo Park
}

🔄 Scraping data (this may take a few minutes)...

📊 Scraped 42 feedback items

💾 Saving to MongoDB collection: whatsapp-feedback
✅ Saved to MongoDB:
   - New items: 35
   - Updated items: 7
   - Total items in collection: 42

✅ Scraping complete!
📁 MongoDB collection: whatsapp-feedback
📊 Total feedback items: 42
```