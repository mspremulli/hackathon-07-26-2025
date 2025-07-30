const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB schema
const FeedbackSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  companyName: { type: String, default: 'WhatsApp' },
  source: { type: String, required: true },
  type: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  sentiment: { type: String },
  rating: { type: Number },
  content: { type: String, required: true },
  metadata: mongoose.Schema.Types.Mixed,
  tags: [String]
});

async function importLatestRun() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env file');
      return;
    }
    
    const dbName = process.env.MONGODB_DB_NAME || 'hackathon-07-26-2025';
    await mongoose.connect(mongoUri, { dbName });
    console.log(`✅ Connected to MongoDB (Database: ${dbName})`);
    
    // Get the Feedback model
    const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);
    
    // Find the latest run directory
    const outputDir = path.join(__dirname, 'output');
    const runs = fs.readdirSync(outputDir).filter(dir => dir.startsWith('run'));
    const latestRun = runs.sort((a, b) => {
      const numA = parseInt(a.replace('run', ''));
      const numB = parseInt(b.replace('run', ''));
      return numA - numB;
    }).pop();
    
    if (!latestRun) {
      console.log('No run directories found');
      return;
    }
    
    console.log(`📂 Importing from: ${latestRun}`);
    
    // Read the hybrid results file
    const resultsPath = path.join(outputDir, latestRun, 'scraped-data');
    const files = fs.readdirSync(resultsPath);
    
    let totalImported = 0;
    
    // Process each JSON file
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const filePath = path.join(resultsPath, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      // Skip if it's the summary file
      if (file.includes('hybrid_scraping_results')) continue;
      
      console.log(`\n📄 Processing: ${file}`);
      
      // Determine source from filename
      let source = 'unknown';
      if (file.includes('app_store')) source = 'app_store';
      else if (file.includes('google_play')) source = 'google_play';
      else if (file.includes('google_reviews')) source = 'google_reviews';
      
      const isReal = file.includes('real');
      
      // Process the data - check if it has a reviews array
      let items = [];
      if (data.reviews && Array.isArray(data.reviews)) {
        items = data.reviews;
      } else if (Array.isArray(data)) {
        items = data;
      } else if (data.review || data.content || data.text) {
        items = [data];
      }
      
      let fileImported = 0;
      
      for (const item of items) {
        if (!item || (!item.review && !item.content && !item.text && !item.comment)) continue;
        
        const feedback = {
          id: `whatsapp-${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          companyName: 'WhatsApp',
          source: source,
          type: isReal ? 'real' : 'mock',
          content: item.review || item.content || item.text || item.comment || JSON.stringify(item),
          rating: item.rating || item.score,
          sentiment: item.sentiment || analyzeSentiment(item.review || item.content || ''),
          timestamp: new Date(item.date || item.timestamp || Date.now()),
          metadata: {
            author: item.author || item.reviewer || item.user || item.name,
            title: item.title,
            version: item.version,
            country: item.country,
            isRealData: isReal
          },
          tags: [source, 'whatsapp', isReal ? 'real-data' : 'mock-data', latestRun]
        };
        
        try {
          await Feedback.findOneAndUpdate(
            { content: feedback.content, source: feedback.source }, // Match by content and source to avoid duplicates
            { $set: feedback },
            { upsert: true, new: true }
          );
          totalImported++;
          fileImported++;
        } catch (error) {
          console.error('Error saving item:', error.message);
        }
      }
      
      console.log(`✅ Imported ${fileImported} items from ${file}`);
    }
    
    console.log(`\n🎉 Total imported: ${totalImported} feedback items`);
    console.log(`📊 Total in database: ${await Feedback.countDocuments()}`);
    
    // Show sample of what was imported
    const samples = await Feedback.find({ companyName: 'WhatsApp' }).limit(3);
    console.log('\n📝 Sample imported data:');
    samples.forEach(item => {
      console.log(`- ${item.source} (${item.type}): "${item.content.substring(0, 50)}..."`);
    });
    
  } catch (error) {
    console.error('Import error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Import complete! Check your dashboard to see the new WhatsApp feedback.');
  }
}

function analyzeSentiment(text) {
  const positive = /good|great|excellent|amazing|love|best|perfect|awesome|fantastic|helpful|useful/i;
  const negative = /bad|terrible|awful|hate|worst|poor|broken|crash|bug|slow|issue/i;
  
  if (positive.test(text)) return 'positive';
  if (negative.test(text)) return 'negative';
  return 'neutral';
}

// Run the import
importLatestRun();