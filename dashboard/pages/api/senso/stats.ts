import type { NextApiRequest, NextApiResponse } from 'next';
import { apiClient } from '../../../lib/api-client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const stats = await apiClient.getDashboardStats();
    res.status(200).json(stats);
  } catch (error: any) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: error.message });
  }
}