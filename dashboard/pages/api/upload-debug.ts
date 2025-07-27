import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { createReadStream } from 'fs';
import csv from 'csv-parser';

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

  console.log('📤 Upload endpoint hit!');

  try {
    const form = new IncomingForm();
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        return res.status(500).json({ error: 'Failed to parse upload' });
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('📁 File received:', file.originalFilename);

      // Process CSV file
      const results: any[] = [];
      
      createReadStream(file.filepath)
        .pipe(csv())
        .on('data', (data) => {
          console.log('📊 CSV row:', data);
          results.push(data);
        })
        .on('end', async () => {
          console.log(`✅ Parsed ${results.length} rows from CSV`);
          
          // Create unique upload ID
          const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Transform CSV data for MongoDB
          const feedbackList = results.map((row, index) => ({
            id: `csv-${uploadId}-row${index}`,
            source: 'user_upload_csv',
            type: 'customer_data',
            timestamp: new Date().toISOString(),
            sentiment: row.sentiment || 'neutral',
            rating: row.rating ? parseFloat(row.rating) : undefined,
            content: row.feedback || row.content || row.review || row.comment || JSON.stringify(row),
            metadata: {
              customer_id: row.customer_id,
              category: row.category,
              nps: row.nps,
              date: row.date,
              uploadId: uploadId
            },
            tags: ['user-upload', 'csv', uploadId]
          }));

          console.log('📦 Prepared feedback items:', feedbackList.length);
          console.log('📝 Sample item:', JSON.stringify(feedbackList[0], null, 2));

          // Send to MongoDB API
          try {
            const mongoUrl = 'http://localhost:3003/api/feedback/bulk';
            console.log('🚀 Sending to MongoDB:', mongoUrl);
            
            const mongoResponse = await fetch(mongoUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ feedbackList })
            });

            const mongoResult = await mongoResponse.json();
            console.log('✅ MongoDB response:', mongoResult);

            return res.status(200).json({ 
              success: true, 
              message: `Successfully uploaded ${results.length} rows`,
              details: {
                rowsParsed: results.length,
                itemsSent: feedbackList.length,
                mongoResponse: mongoResult,
                uploadId: uploadId
              }
            });
          } catch (error) {
            console.error('❌ MongoDB error:', error);
            return res.status(500).json({ 
              error: 'Failed to save to MongoDB',
              details: error.message 
            });
          }
        })
        .on('error', (error) => {
          console.error('❌ CSV parsing error:', error);
          return res.status(500).json({ error: 'Failed to parse CSV' });
        });
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}