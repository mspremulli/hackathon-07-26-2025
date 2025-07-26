import type { NextApiRequest, NextApiResponse } from 'next';
import { apiClient } from '../../../lib/api-client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const feedback = await apiClient.getRecentFeedback(limit);
    res.status(200).json(feedback);
  } catch (error: any) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: error.message });
  }
}