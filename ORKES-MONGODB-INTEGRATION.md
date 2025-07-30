# Orkes MongoDB Integration Guide

## Quick Start

1. **MongoDB is now set up with your data!** 

2. **Run the migration** (if not done already):
```bash
npm run migrate:mongodb
```

3. **Start the MongoDB API server**:
```bash
npm run api:mongodb
```

The API will run on `http://localhost:3003`

## API Endpoints for Orkes

### 1. Get Feedback Data
```http
GET http://localhost:3003/api/feedback?limit=50&source=app_store&sentiment=positive
```

### 2. Get Statistics
```http
GET http://localhost:3003/api/stats
```

### 3. Health Check
```http
GET http://localhost:3003/health
```

### 4. Add New Feedback (from Orkes workflows)
```http
POST http://localhost:3003/api/feedback
Content-Type: application/json

{
  "id": "orkes-feedback-123",
  "source": "orkes_workflow",
  "type": "analysis",
  "timestamp": "2025-07-26T10:00:00Z",
  "sentiment": "positive",
  "content": "Workflow analysis result",
  "metadata": {
    "workflow_id": "analyze-feedback-workflow",
    "task_id": "task-123"
  },
  "tags": ["orkes", "automated-analysis"]
}
```

## MongoDB Schema

```javascript
{
  id: String (unique),
  source: String,
  type: String,
  timestamp: Date,
  sentiment: String (positive/negative/neutral/mixed),
  rating: Number (1-5, optional),
  content: String,
  metadata: Object,
  tags: Array<String>,
  senso_context_id: String (optional),
  created_at: Date,
  updated_at: Date
}
```

## Environment Variables

Make sure these are in your `.env`:
```
MONGODB_URI=your_mongodb_connection_string
MONGODB_API_PORT=3003
```

## Sample Orkes Worker Code

```javascript
// In your Orkes worker
const axios = require('axios');

async function getFeedbackData(source) {
  const response = await axios.get(`http://localhost:3003/api/feedback?source=${source}`);
  return response.data;
}

async function getStats() {
  const response = await axios.get('http://localhost:3003/api/stats');
  return response.data;
}

// Use in your workflow tasks
module.exports = {
  analyzeFeedback: async (input) => {
    const feedback = await getFeedbackData(input.source);
    // Process feedback...
    return { analyzed: feedback.length };
  }
};
```

## Quick Test

```bash
# Test the API
curl http://localhost:3003/health

# Get some feedback
curl http://localhost:3003/api/feedback?limit=5

# Get stats
curl http://localhost:3003/api/stats
```

The MongoDB integration is ready for Orkes to consume!