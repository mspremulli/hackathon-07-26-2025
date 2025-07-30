# Company Configuration

The dashboard is configured to display data for a single company. To change the company:

## Quick Setup

Edit the file `dashboard/config/company.json`:

```json
{
  "companyName": "WhatsApp",
  "companyDescription": "Instant messaging and voice-over-IP service",
  "primaryColor": "#25D366",
  "logo": "💬"
}
```

## Available Company Presets

### WhatsApp
```json
{
  "companyName": "WhatsApp",
  "companyDescription": "Instant messaging and voice-over-IP service",
  "primaryColor": "#25D366",
  "logo": "💬"
}
```

### Uber
```json
{
  "companyName": "Uber",
  "companyDescription": "Ride-hailing and delivery platform",
  "primaryColor": "#000000",
  "logo": "🚗"
}
```

### Airbnb
```json
{
  "companyName": "Airbnb",
  "companyDescription": "Online marketplace for lodging and tourism",
  "primaryColor": "#FF5A5F",
  "logo": "🏠"
}
```

### Spotify
```json
{
  "companyName": "Spotify",
  "companyDescription": "Music streaming platform",
  "primaryColor": "#1DB954",
  "logo": "🎵"
}
```

### Your Custom Company
```json
{
  "companyName": "Your Company Name",
  "companyDescription": "Your company description",
  "primaryColor": "#667eea",
  "logo": "🚀"
}
```

## How It Works

1. The dashboard reads from `config/company.json` on startup
2. The company name appears in the header
3. The Voice EIR mentions the company name in responses
4. All feedback data is filtered for this company

## Scraping Data for Your Company

To populate the dashboard with your company's data:

```bash
# Use the quick scraper
npx ts-node src/scrape-company-quick.ts "Your Company Name"

# Or use interactive mode
npx ts-node src/scrape-company.ts
```

The scraped data will be stored in MongoDB and automatically appear in the dashboard.