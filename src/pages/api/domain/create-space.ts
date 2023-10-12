import { NextApiRequest, NextApiResponse } from "next";
import { CreateSpaceProps, Space } from "../../../modules/MultiDomain/types";
import { createSpace } from "../../../modules/MultiDomain/actions";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const requestInitiator = "0xA0A0a78069D37d60E54f13b20E951b4A2Ae18FE0" // TODO get from auth context with jwt the signer
  if (req.method === 'POST') {
    const body: CreateSpaceProps = req.body;
    console.log('Received data:', body);

    const result = await createSpace({ ...body, owners: [requestInitiator], subDomain: `${body.subDomain}.solarfund.wtf` })

    if (result.message) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(400).json({ error: result.error });
    }

  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}