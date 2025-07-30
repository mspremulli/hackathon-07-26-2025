#!/usr/bin/env node
import { HybridScraperAgent } from './agents/hybrid-scraper-agent';
import { mongoClient } from './database/mongodb-client';
import mongoose from 'mongoose';
import readline from 'readline';

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

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function getCompanyConfig() {
  console.log('🔍 Company Feedback Scraper\n');
  
  const companyName = await promptUser('Enter company name: ');
  const appStoreId = await promptUser('Enter iOS App Store ID (or press Enter to skip): ');
  const googlePlayId = await promptUser('Enter Android app package name (or press Enter to skip): ');
  const location = await promptUser('Enter location (default: San Francisco): ') || 'San Francisco';
  
  return {
    companyName,
    businessName: companyName,
    appStoreAppId: appStoreId || undefined,
    googlePlayAppId: googlePlayId || undefined,
    location
  };
}

async function saveToMongoDB(companyName: string, feedbackItems: any[]) {
  try {
    // Connect to MongoDB
    await mongoClient.connect();
    
    // Create collection name from company name (lowercase, replace spaces with dashes)
    const collectionName = `${companyName.toLowerCase().replace(/\s+/g, '-')}-feedback`;
    
    // Create or get the model for this company
    const CompanyFeedback = mongoose.models[collectionName] || 
      mongoose.model(collectionName, CompanyFeedbackSchema);
    
    console.log(`\n💾 Saving to MongoDB collection: ${collectionName}`);
    
    // Prepare bulk operations
    const bulkOps = feedbackItems.map((item) => ({
      updateOne: {
        filter: { id: item.id },
        update: { 
          $set: {
            ...item,
            companyName: companyName,
            timestamp: new Date(item.timestamp || Date.now())
          }
        },
        upsert: true
      }
    }));
    
    // Execute bulk operation
    const result = await CompanyFeedback.bulkWrite(bulkOps as any);
    
    console.log(`✅ Saved to MongoDB:`);
    console.log(`   - New items: ${result.upsertedCount}`);
    console.log(`   - Updated items: ${result.modifiedCount}`);
    console.log(`   - Total items in collection: ${await CompanyFeedback.countDocuments()}`);
    
    return {
      collection: collectionName,
      newItems: result.upsertedCount,
      updatedItems: result.modifiedCount,
      totalItems: await CompanyFeedback.countDocuments()
    };
  } catch (error) {
    console.error('❌ Error saving to MongoDB:', error);
    throw error;
  }
}

async function main() {
  try {
    // Get company configuration from user
    const config = await getCompanyConfig();
    
    console.log('\n🚀 Starting scraper for:', config.companyName);
    console.log('📍 Configuration:', {
      appStore: config.appStoreAppId || 'Not provided',
      googlePlay: config.googlePlayAppId || 'Not provided',
      location: config.location
    });
    
    // Initialize scraper
    const scraper = new HybridScraperAgent();
    
    // Scrape data
    console.log('\n🔄 Scraping data (this may take a few minutes)...\n');
    const results = await scraper.scrapeWithRealDataFirst(config);
    
    // Extract all feedback items from results
    const allFeedback: any[] = [];
    
    Object.entries(results).forEach(([source, data]: [string, any]) => {
      if (data.success && data.data) {
        const items = Array.isArray(data.data) ? data.data : [data.data];
        items.forEach((item: any) => {
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
    } else {
      console.log('\n⚠️  No feedback items found to save');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positive = /good|great|excellent|amazing|love|best|perfect|awesome|fantastic/i;
  const negative = /bad|terrible|awful|hate|worst|poor|broken|crash|bug/i;
  
  if (positive.test(text)) return 'positive';
  if (negative.test(text)) return 'negative';
  return 'neutral';
}

// Run the script
main().catch(console.error);