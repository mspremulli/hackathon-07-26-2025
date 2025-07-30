#!/usr/bin/env node
const { HybridScraperAgent } = require('./agents/hybrid-scraper-agent');
const { mongoClient } = require('./database/mongodb-client');
const mongoose = require('mongoose');

// MongoDB schema for company feedback
const CompanyFeedbackSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  companyName: { type: String, required: true, index: true },
  source: { type: String, required: true },
  type: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  sentiment: { type: String, enum: ['positive', 'negative', 'neutral'] },
  rating: { type: Number, min: 1, max: 5 },
  content: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  tags: [String]
});

// Popular company configurations
const COMPANY_CONFIGS = {
  'whatsapp': {
    companyName: 'WhatsApp',
    businessName: 'WhatsApp',
    appStoreAppId: '310633997',
    googlePlayAppId: 'com.whatsapp',
    location: 'Menlo Park'
  },
  'uber': {
    companyName: 'Uber',
    businessName: 'Uber',
    appStoreAppId: '368677368',
    googlePlayAppId: 'com.ubercab',
    location: 'San Francisco'
  },
  'airbnb': {
    companyName: 'Airbnb',
    businessName: 'Airbnb',
    appStoreAppId: '401626263',
    googlePlayAppId: 'com.airbnb.android',
    location: 'San Francisco'
  },
  'spotify': {
    companyName: 'Spotify',
    businessName: 'Spotify',
    appStoreAppId: '324684580',
    googlePlayAppId: 'com.spotify.music',
    location: 'Stockholm'
  },
  'netflix': {
    companyName: 'Netflix',
    businessName: 'Netflix',
    appStoreAppId: '363590051',
    googlePlayAppId: 'com.netflix.mediaclient',
    location: 'Los Gatos'
  }
};

async function saveToMongoDB(companyName, feedbackItems) {
  try {
    await mongoClient.connect();
    
    const collectionName = `${companyName.toLowerCase().replace(/\s+/g, '-')}-feedback`;
    const CompanyFeedback = mongoose.models[collectionName] || 
      mongoose.model(collectionName, CompanyFeedbackSchema);
    
    console.log(`\n💾 Saving to MongoDB collection: ${collectionName}`);
    
    let insertedCount = 0;
    let updatedCount = 0;
    
    for (const item of feedbackItems) {
      try {
        const existing = await CompanyFeedback.findOne({ id: item.id });
        
        if (existing) {
          await CompanyFeedback.updateOne(
            { id: item.id },
            { 
              $set: {
                ...item,
                companyName: companyName,
                timestamp: new Date(item.timestamp || Date.now())
              }
            }
          );
          updatedCount++;
        } else {
          const newDoc = new CompanyFeedback({
            ...item,
            companyName: companyName,
            timestamp: new Date(item.timestamp || Date.now())
          });
          await newDoc.save();
          insertedCount++;
        }
      } catch (error) {
        console.error('Error saving item:', error.message);
      }
    }
    
    console.log(`✅ Saved to MongoDB:`);
    console.log(`   - New items: ${insertedCount}`);
    console.log(`   - Updated items: ${updatedCount}`);
    console.log(`   - Total items in collection: ${await CompanyFeedback.countDocuments()}`);
    
    return {
      collection: collectionName,
      newItems: insertedCount,
      updatedItems: updatedCount,
      totalItems: await CompanyFeedback.countDocuments()
    };
  } catch (error) {
    console.error('❌ Error saving to MongoDB:', error);
    throw error;
  }
}

async function main() {
  try {
    // Get company name from command line
    const companyArg = process.argv[2];
    
    if (!companyArg) {
      console.log('Usage: node src/scrape-company-quick.js <company>');
      console.log('\nAvailable companies:');
      Object.keys(COMPANY_CONFIGS).forEach(key => {
        console.log(`  - ${key} (${COMPANY_CONFIGS[key].companyName})`);
      });
      console.log('\nOr use any company name for generic search');
      process.exit(1);
    }
    
    // Get config - either predefined or create generic one
    const config = COMPANY_CONFIGS[companyArg.toLowerCase()] || {
      companyName: companyArg,
      businessName: companyArg,
      location: 'San Francisco'
    };
    
    console.log('\n🚀 Starting scraper for:', config.companyName);
    console.log('📍 Configuration:', {
      appStore: config.appStoreAppId || 'Not configured',
      googlePlay: config.googlePlayAppId || 'Not configured',
      location: config.location
    });
    
    // Initialize scraper
    const scraper = new HybridScraperAgent();
    
    // Scrape data
    console.log('\n🔄 Scraping data (this may take a few minutes)...\n');
    const results = await scraper.scrapeWithRealDataFirst(config);
    
    // Extract all feedback items from results
    const allFeedback = [];
    
    Object.entries(results).forEach(([source, data]) => {
      if (data.success && data.data) {
        const items = Array.isArray(data.data) ? data.data : [data.data];
        items.forEach((item) => {
          if (item.content || item.review || item.text || item.comment) {
            allFeedback.push({
              id: `${config.companyName}-${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              source: source,
              type: data.realData ? 'real' : 'mock',
              content: item.content || item.review || item.text || item.comment || JSON.stringify(item),
              rating: item.rating || item.score || undefined,
              sentiment: item.sentiment || analyzeSentiment(item.content || item.review || ''),
              metadata: {
                author: item.author || item.user || item.reviewer,
                date: item.date || item.timestamp,
                title: item.title,
                ...item
              },
              tags: [source, config.companyName, data.realData ? 'real-data' : 'mock-data']
            });
          }
        });
      }
    });
    
    console.log(`\n📊 Scraped ${allFeedback.length} feedback items`);
    
    // Save to MongoDB
    if (allFeedback.length > 0) {
      const mongoResult = await saveToMongoDB(config.companyName, allFeedback);
      
      console.log('\n✅ Scraping complete!');
      console.log(`📁 MongoDB collection: ${mongoResult.collection}`);
      console.log(`📊 Total feedback items: ${mongoResult.totalItems}`);
      console.log('\n💡 View in MongoDB:');
      console.log(`   db['${mongoResult.collection}'].find().pretty()`);
    } else {
      console.log('\n⚠️  No feedback items found to save');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

function analyzeSentiment(text) {
  const positive = /good|great|excellent|amazing|love|best|perfect|awesome|fantastic/i;
  const negative = /bad|terrible|awful|hate|worst|poor|broken|crash|bug/i;
  
  if (positive.test(text)) return 'positive';
  if (negative.test(text)) return 'negative';
  return 'neutral';
}

// Run the script
main().catch(console.error);