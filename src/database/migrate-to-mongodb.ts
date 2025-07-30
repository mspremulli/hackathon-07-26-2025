import { mongoClient } from './mongodb-client';
import { Feedback } from './schemas/feedback.schema';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

interface ContextData {
  id: string;
  source: string;
  type: string;
  timestamp: Date;
  metadata?: any;
  data?: any;
  tags?: string[];
  senso_context_id?: string;
}

// Helper functions to extract source and type from filename
function extractSource(filename: string): string {
  if (filename.includes('app_store')) return 'app_store';
  if (filename.includes('google_play')) return 'google_play';
  if (filename.includes('reddit')) return 'reddit';
  if (filename.includes('twitter')) return 'twitter';
  if (filename.includes('discord')) return 'discord';
  if (filename.includes('github')) return 'github';
  if (filename.includes('glassdoor')) return 'glassdoor';
  if (filename.includes('linkedin')) return 'linkedin';
  if (filename.includes('stackoverflow')) return 'stackoverflow';
  if (filename.includes('hackernews')) return 'hackernews';
  if (filename.includes('youtube')) return 'youtube';
  if (filename.includes('google')) return 'google_reviews';
  return 'unknown';
}

function extractType(filename: string): string {
  if (filename.includes('review')) return 'reviews';
  if (filename.includes('feedback')) return 'feedback';
  if (filename.includes('analysis')) return 'analysis';
  if (filename.includes('post')) return 'posts';
  if (filename.includes('comment')) return 'comments';
  return 'feedback';
}

async function migrateDataToMongoDB() {
  console.log('🚀 Starting MongoDB migration...');
  
  try {
    // Connect to MongoDB
    await mongoClient.connect();
    
    // Load existing data from output directories
    let allContexts: ContextData[] = [];
    
    // Load data from output directories
    const outputPath = join(__dirname, '../../output');
    const runDirs = ['run1', 'run2', 'run3', 'run4', 'run5'];
    
    for (const runDir of runDirs) {
      const scrapedDataPath = join(outputPath, runDir, 'scraped-data');
      if (existsSync(scrapedDataPath)) {
        console.log(`📁 Loading data from ${runDir}...`);
        
        // Read all JSON files in the directory
        const files = readdirSync(scrapedDataPath).filter(f => f.endsWith('.json'));
        
        for (const file of files) {
          const filePath = join(scrapedDataPath, file);
          try {
            const data = JSON.parse(readFileSync(filePath, 'utf-8'));
            
            // Handle different data formats
            if (Array.isArray(data)) {
              // If it's an array of items
              data.forEach((item, idx) => {
                if (item.content || item.text || item.review) {
                  allContexts.push({
                    id: item.id || `${file}-${idx}`,
                    source: extractSource(file),
                    type: extractType(file),
                    timestamp: new Date(item.timestamp || item.date || Date.now()),
                    metadata: {
                      sentiment: item.sentiment || 'neutral',
                      rating: item.rating,
                      ...item.metadata
                    },
                    data: {
                      content: item.content || item.text || item.review || JSON.stringify(item)
                    },
                    tags: item.tags || [extractSource(file), runDir]
                  });
                }
              });
            } else if (data.data && Array.isArray(data.data)) {
              // If data is wrapped in a data property
              data.data.forEach((item: any, idx: number) => {
                allContexts.push({
                  id: item.id || `${file}-${idx}`,
                  source: data.source || extractSource(file),
                  type: data.type || extractType(file),
                  timestamp: new Date(item.timestamp || item.date || data.timestamp || Date.now()),
                  metadata: {
                    sentiment: item.sentiment || 'neutral',
                    rating: item.rating,
                    ...item.metadata
                  },
                  data: {
                    content: item.content || item.text || item.review || JSON.stringify(item)
                  },
                  tags: item.tags || [extractSource(file), runDir]
                });
              });
            } else if (data.feedback && Array.isArray(data.feedback)) {
              // If data is wrapped in a feedback property
              data.feedback.forEach((item: any, idx: number) => {
                allContexts.push({
                  id: item.id || `${file}-${idx}`,
                  source: item.source || data.source || extractSource(file),
                  type: data.type || extractType(file),
                  timestamp: new Date(item.timestamp || item.date || data.timestamp || Date.now()),
                  metadata: {
                    sentiment: item.sentiment || 'neutral',
                    rating: item.rating,
                    ...item.metadata
                  },
                  data: {
                    content: item.content || item.text || item.review || JSON.stringify(item)
                  },
                  tags: item.tags || [extractSource(file), runDir]
                });
              });
            }
          } catch (error) {
            console.warn(`⚠️ Failed to parse ${file}:`, error.message);
          }
        }
      }
    }
    
    // Also load from local Senso storage if it exists
    const sensoStoragePath = join(__dirname, '../../.senso-local-storage.json');
    if (existsSync(sensoStoragePath)) {
      console.log('📁 Loading Senso.ai local storage data...');
      const sensoData = JSON.parse(readFileSync(sensoStoragePath, 'utf-8'));
      if (sensoData.contexts) {
        const contexts = Object.values(sensoData.contexts) as ContextData[];
        allContexts = [...allContexts, ...contexts];
      }
    }
    
    console.log(`📊 Found ${allContexts.length} total contexts to migrate`);
    
    // Clear existing data (for fresh start)
    await Feedback.deleteMany({});
    console.log('🧹 Cleared existing MongoDB data');
    
    // Transform and insert data
    const feedbackDocs = allContexts.map(ctx => ({
      id: ctx.id,
      source: ctx.source,
      type: ctx.type || 'unknown',
      timestamp: new Date(ctx.timestamp),
      sentiment: ctx.metadata?.sentiment || 'neutral',
      rating: ctx.metadata?.rating,
      content: ctx.data?.content || ctx.data?.text || JSON.stringify(ctx.data),
      metadata: ctx.metadata || {},
      tags: ctx.tags || [],
      senso_context_id: ctx.senso_context_id
    }));
    
    // Insert in batches
    const batchSize = 100;
    for (let i = 0; i < feedbackDocs.length; i += batchSize) {
      const batch = feedbackDocs.slice(i, i + batchSize);
      await Feedback.insertMany(batch);
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(feedbackDocs.length/batchSize)}`);
    }
    
    console.log(`✅ Migration complete! Migrated ${feedbackDocs.length} documents to MongoDB`);
    
    // Verify migration
    const count = await Feedback.countDocuments();
    console.log(`📊 Total documents in MongoDB: ${count}`);
    
    // Show sample data
    const sample = await Feedback.findOne({ source: 'app_store' });
    console.log('\n📌 Sample migrated document:', JSON.stringify(sample, null, 2));
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await mongoClient.disconnect();
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrateDataToMongoDB()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateDataToMongoDB };