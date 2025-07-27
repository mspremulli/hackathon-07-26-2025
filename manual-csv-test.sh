#!/bin/bash

echo "📊 Manual CSV Upload Test"
echo "========================"

# Create test data that matches our CSV structure
cat > test-upload.json << EOF
{
  "feedbackList": [
    {
      "id": "manual-test-1",
      "source": "user_upload_csv",
      "type": "customer_data",
      "timestamp": "2025-07-26T23:30:00Z",
      "sentiment": "positive",
      "rating": 5,
      "content": "The new AI features are incredible! This is exactly what we needed",
      "metadata": {
        "category": "features",
        "nps": 10,
        "customer_id": "2001"
      },
      "tags": ["user-data", "csv-import", "customer-feedback"]
    },
    {
      "id": "manual-test-2",
      "source": "user_upload_csv",
      "type": "customer_data",
      "timestamp": "2025-07-26T23:30:00Z",
      "sentiment": "negative",
      "rating": 1,
      "content": "App keeps freezing when I try to export data",
      "metadata": {
        "category": "bugs",
        "nps": 2,
        "customer_id": "2002"
      },
      "tags": ["user-data", "csv-import", "customer-feedback"]
    }
  ]
}
EOF

echo ""
echo "📤 Uploading to MongoDB..."
curl -X POST http://localhost:3003/api/feedback/bulk \
  -H "Content-Type: application/json" \
  -d @test-upload.json

echo ""
echo ""
echo "📊 Checking stats..."
curl http://localhost:3003/api/stats 2>/dev/null | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'Total feedback: {data[\"totalFeedback\"]}')"

rm test-upload.json