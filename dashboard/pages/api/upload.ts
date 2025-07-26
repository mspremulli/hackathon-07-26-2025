import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import csv from 'csv-parser';
import { createReadStream } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm();
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        return res.status(500).json({ error: 'Failed to parse upload' });
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      const type = Array.isArray(fields.type) ? fields.type[0] : fields.type;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Process CSV file
      if (type === 'csv') {
        const results: any[] = [];
        
        createReadStream(file.filepath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', async () => {
            // Process CSV data and store in Senso.ai Context OS
            const processedData = results.map((row, index) => ({
              id: `csv-upload-${Date.now()}-${index}`,
              source: 'user_upload_csv',
              type: 'customer_data',
              timestamp: new Date(),
              data: row,
              metadata: {
                // Try to detect sentiment from common fields
                sentiment: detectSentiment(row),
                rating: extractRating(row),
                uploadedAt: new Date()
              },
              tags: ['user-data', 'csv-import', 'customer-feedback']
            }));

            // Send to API server
            try {
              const apiResponse = await fetch('http://localhost:3000/api/upload/csv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contexts: processedData })
              });

              if (!apiResponse.ok) {
                throw new Error(`API server error: ${apiResponse.status}`);
              }

              const apiResult = await apiResponse.json();
              console.log('API server response:', apiResult);

              res.status(200).json({ 
                success: true, 
                message: `Processed ${results.length} rows from CSV`,
                rowCount: results.length,
                apiResponse: apiResult
              });
            } catch (apiError) {
              console.error('Failed to send to API server:', apiError);
              // Still return success since we processed the CSV
              res.status(200).json({ 
                success: true, 
                message: `Processed ${results.length} rows locally (API server may be down)`,
                rowCount: results.length,
                warning: 'Data processed but not stored in API server'
              });
            }
          })
          .on('error', (error) => {
            console.error('CSV processing error:', error);
            res.status(500).json({ error: 'Failed to process CSV' });
          });
      } else {
        // Handle other file types
        res.status(400).json({ error: 'Unsupported file type' });
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}

function detectSentiment(row: any): string {
  // Simple sentiment detection based on common fields
  const checkFields = ['sentiment', 'feedback', 'comment', 'review', 'satisfaction'];
  const positiveWords = ['good', 'great', 'excellent', 'love', 'happy', 'satisfied'];
  const negativeWords = ['bad', 'poor', 'terrible', 'hate', 'unhappy', 'dissatisfied'];
  
  for (const field of checkFields) {
    if (row[field]) {
      const text = String(row[field]).toLowerCase();
      const hasPositive = positiveWords.some(word => text.includes(word));
      const hasNegative = negativeWords.some(word => text.includes(word));
      
      if (hasPositive && !hasNegative) return 'positive';
      if (hasNegative && !hasPositive) return 'negative';
      if (hasPositive && hasNegative) return 'mixed';
    }
  }
  
  return 'neutral';
}

function extractRating(row: any): number | undefined {
  // Look for rating fields
  const ratingFields = ['rating', 'score', 'nps', 'satisfaction_score', 'stars'];
  
  for (const field of ratingFields) {
    if (row[field]) {
      const value = parseFloat(row[field]);
      if (!isNaN(value)) {
        // Normalize to 1-5 scale if needed
        if (value > 5) {
          return Math.round((value / 10) * 5);
        }
        return value;
      }
    }
  }
  
  return undefined;
}