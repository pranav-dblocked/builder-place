import { NextApiRequest, NextApiResponse } from 'next';
import { deleteSpace } from '../../../modules/MultiDomain/actions';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'DELETE') {
    const { subDomain } = req.query;
    console.log('Received space:', subDomain);

    const result = await deleteSpace(subDomain as string);

    if (result.message) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(400).json({ error: result.error });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}