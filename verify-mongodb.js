const mongoose = require('mongoose');
require('dotenv').config();

async function verifyMongoDB() {
  try {
    const dbName = process.env.MONGODB_DB_NAME || 'hackathon-07-26-2025';
    console.log(`🔍 Connecting to database: ${dbName}`);
    
    await mongoose.connect(process.env.MONGODB_URI, { dbName });
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\n📚 Collections in database:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    const feedbackCollection = db.collection('feedbacks');
    const count = await feedbackCollection.countDocuments();
    console.log(`\n📊 Total documents in feedbacks collection: ${count}`);
    
    const sample = await feedbackCollection.findOne();
    console.log('\n📌 Sample document:');
    console.log(JSON.stringify(sample, null, 2));
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyMongoDB();