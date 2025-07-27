# CSV Upload Testing Guide

## Files Available for Upload

1. **new-feedback-data.csv** (20 rows)
   - Fresh customer feedback from today
   - Mix of positive/negative sentiments
   - Topics: AI features, performance, pricing

2. **test-unique-feedback.csv** (10 rows)
   - Hackathon-specific feedback
   - References all our integrations (Orkes, Senso.ai, Vapi, etc.)
   - All positive sentiment about the demo!

3. **sample-customer-data.csv** (15 rows)
   - Original test data
   - General app feedback

## How to Test

1. **Restart MongoDB API** (to get the updated bulk insert logic):
```bash
# Kill any existing process
pkill -f mongodb-api

# Start fresh
npm run api:mongodb
```

2. **Upload a CSV**:
   - Go to dashboard: http://localhost:3001
   - Find "Import Your Data" section (bottom right)
   - Click and select one of the CSV files
   - Watch for "Upload successful!"

3. **Verify Upload**:
   - Check the feedback count increases
   - Sentiment breakdown should update
   - New feedback appears in the list

## What's Fixed

- **Unique IDs**: Each upload gets unique IDs with timestamp + random string
- **Upsert Logic**: Uses MongoDB bulkWrite to handle duplicates gracefully
- **Better Response**: Shows how many items were new vs updated

## Expected Results

When uploading `new-feedback-data.csv`:
- Before: 30 feedback items
- After: 50 feedback items (+20 new)
- Sentiment: More negative feedback added

When uploading `test-unique-feedback.csv`:
- Before: 50 feedback items  
- After: 60 feedback items (+10 new)
- Sentiment: Boost in positive feedback

## Troubleshooting

If upload shows "0 inserted":
1. IDs might be duplicates - try a different CSV
2. MongoDB API might need restart
3. Check browser console for errors

The MongoDB bulk insert now uses `upsert` which means:
- New items → Inserted
- Existing items (same ID) → Updated
- No more duplicate errors!