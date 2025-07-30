import type { NextApiRequest, NextApiResponse } from 'next';
import companyConfig from '../../config/company.json';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json(companyConfig);
}