const fs = require('fs');
const csv = require('csv-parser');

// Test parsing the CSV file
const csvPath = './dashboard/public/new-feedback-data.csv';
const results = [];

console.log('🔍 Testing CSV parsing...\n');

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (data) => {
    console.log('Row:', data);
    results.push(data);
  })
  .on('end', () => {
    console.log(`\n✅ Parsed ${results.length} rows`);
    
    // Show what the processed data would look like
    const processedData = results.slice(0, 3).map((row, index) => ({
      id: `csv-test-${index}`,
      source: 'user_upload_csv',
      type: 'customer_data',
      timestamp: new Date(),
      sentiment: row.sentiment || 'neutral',
      rating: row.rating ? parseInt(row.rating) : undefined,
      content: row.feedback || row.content || JSON.stringify(row),
      metadata: {
        sentiment: row.sentiment,
        rating: row.rating,
        category: row.category,
        nps: row.nps
      },
      tags: ['user-data', 'csv-import', 'customer-feedback']
    }));
    
    console.log('\n📦 Processed data sample:');
    console.log(JSON.stringify(processedData[0], null, 2));
  })
  .on('error', (error) => {
    console.error('❌ CSV parsing error:', error);
  });