const fs = require('fs');
const path = require('path');

async function testMongoDBUpload() {
  console.log('🧪 Testing MongoDB CSV Upload Integration\n');
  
  // 1. Check MongoDB is running
  try {
    const healthRes = await fetch('http://localhost:3003/health');
    const health = await healthRes.json();
    console.log('✅ MongoDB API Status:', health.status);
    console.log('📊 Current feedback count:', health.feedbackCount);
  } catch (error) {
    console.error('❌ MongoDB API not running on port 3003');
    console.log('Run: npm run api:mongodb');
    return;
  }
  
  // 2. Read sample CSV
  const csvPath = path.join(__dirname, 'dashboard/public/sample-customer-data.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  console.log('\n📄 Sample CSV has', csvContent.split('\n').length - 1, 'rows');
  
  // 3. Create form data
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', Buffer.from(csvContent), {
    filename: 'test-upload.csv',
    contentType: 'text/csv'
  });
  form.append('type', 'csv');
  
  // 4. Upload to dashboard API
  console.log('\n📤 Uploading CSV to dashboard...');
  try {
    const uploadRes = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const result = await uploadRes.json();
    console.log('📥 Upload result:', result);
    
    if (result.mongodbResponse) {
      console.log('✅ MongoDB integration working!');
      console.log(`   Added ${result.mongodbResponse.inserted} new items`);
    }
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
  
  // 5. Verify data in MongoDB
  console.log('\n🔍 Verifying data in MongoDB...');
  try {
    const statsRes = await fetch('http://localhost:3003/api/stats');
    const stats = await statsRes.json();
    console.log('📊 New total feedback count:', stats.totalFeedback);
    console.log('📈 Sentiment breakdown:', stats.sentimentBreakdown);
  } catch (error) {
    console.error('❌ Failed to verify:', error);
  }
}

// Run test
testMongoDBUpload();