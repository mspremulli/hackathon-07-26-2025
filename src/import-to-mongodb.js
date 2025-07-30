const fs = require('fs');
const path = require('path');
const { mongoClient } = require('./database/mongodb-client');
const mongoose = require('mongoose');

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
    await mongoClient.connect();
    
    // Get the Feedback model
    const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);
    
    // Find the latest run directory
    const outputDir = path.join(__dirname, '..', 'output');
    const runs = fs.readdirSync(outputDir).filter(dir => dir.startsWith('run'));
    const latestRun = runs.sort().pop();
    
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
      
      // Process the data array
      const items = Array.isArray(data) ? data : [data];
      
      for (const item of items) {
        if (!item || (!item.review && !item.content && !item.text)) continue;
        
        const feedback = {
          id: `whatsapp-${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          companyName: 'WhatsApp',
          source: source,
          type: isReal ? 'real' : 'mock',
          content: item.review || item.content || item.text || JSON.stringify(item),
          rating: item.rating || item.score,
          sentiment: item.sentiment || analyzeSentiment(item.review || item.content || ''),
          timestamp: new Date(item.date || item.timestamp || Date.now()),
          metadata: {
            author: item.author || item.reviewer || item.user,
            title: item.title,
            version: item.version,
            country: item.country,
            ...item
          },
          tags: [source, 'whatsapp', isReal ? 'real-data' : 'mock-data', latestRun]
        };
        
        try {
          await Feedback.findOneAndUpdate(
            { id: feedback.id },
            { $set: feedback },
            { upsert: true, new: true }
          );
          totalImported++;
        } catch (error) {
          console.error('Error saving item:', error.message);
        }
      }
      
      console.log(`✅ Imported ${items.length} items from ${file}`);
    }
    
    console.log(`\n🎉 Total imported: ${totalImported} feedback items`);
    console.log(`📊 Total in database: ${await Feedback.countDocuments()}`);
    
    // Also save to WhatsApp-specific collection
    const WhatsAppFeedback = mongoose.models['whatsapp-feedback'] || 
      mongoose.model('whatsapp-feedback', FeedbackSchema);
    
    // Copy all WhatsApp feedback to the company collection
    const whatsappItems = await Feedback.find({ companyName: 'WhatsApp' });
    for (const item of whatsappItems) {
      await WhatsAppFeedback.findOneAndUpdate(
        { id: item.id },
        { $set: item.toObject() },
        { upsert: true }
      );
    }
    
    console.log(`\n✅ Also saved to whatsapp-feedback collection`);
    console.log(`📊 Items in whatsapp-feedback: ${await WhatsAppFeedback.countDocuments()}`);
    
  } catch (error) {
    console.error('Import error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

function analyzeSentiment(text) {
  const positive = /good|great|excellent|amazing|love|best|perfect|awesome|fantastic/i;
  const negative = /bad|terrible|awful|hate|worst|poor|broken|crash|bug/i;
  
  if (positive.test(text)) return 'positive';
  if (negative.test(text)) return 'negative';
  return 'neutral';
}

// Run the import
importLatestRun();