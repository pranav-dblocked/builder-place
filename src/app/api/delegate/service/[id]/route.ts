import { getConfig } from '../../../../../config';
import {
  getUserByAddress,
  getUserByTalentLayerId,
} from '../../../../../modules/BuilderPlace/actions/user';
import TalentLayerService from '../../../../../contracts/ABI/TalentLayerService.json';
import {
  getDelegationSigner,
  getPublicClient,
  isPlatformAllowedToDelegate,
} from '../../../../utils/delegate';
import { recoverMessageAddress } from 'viem';
import { ERROR_EMAIL_NOT_VERIFIED } from '../../../../../modules/BuilderPlace/apiResponses';
import {
  checkOrResetTransactionCounter,
  incrementWeeklyTransactionCounter,
} from '../../../../utils/email';
import { initializeTalentLayerClient } from '../../../../../utils/delegate';

export interface IUpdateService {
  chainId: number;
  userId: string;
  userAddress: string;
  serviceDetails: any;
  signature: `0x${string}` | Uint8Array;
}

/**
 * PUT /api/delegate/service
 */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  console.log('PUT');
  const body: IUpdateService = await req.json();
  console.log('json', body);
  const { chainId, userId, userAddress, serviceDetails, signature } = body;

  const config = getConfig(chainId);

  if (process.env.NEXT_PUBLIC_ACTIVATE_DELEGATE !== 'true') {
    return Response.json({ message: 'Delegation is not activated' }, { status: 500 });
  }

  const signatureAddress = await recoverMessageAddress({
    message: `connect with ${userAddress}`,
    signature: signature,
  });

  const user = await getUserByAddress(signatureAddress);

  if (user?.talentLayerId !== userId) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const user = await getUserByTalentLayerId(userId);

    if (user) {
      if (!user.isEmailVerified) {
        console.log('Email not verified');
        return Response.json({ error: ERROR_EMAIL_NOT_VERIFIED }, { status: 401 });
      }

      await checkOrResetTransactionCounter(user);
      const canDelegate = await isPlatformAllowedToDelegate(chainId, userAddress);

      if (!canDelegate) {
        Response.json({ error: 'Delegation is Not activated for this address' }, { status: 401 });
      }

      const publicClient = getPublicClient();
      if (!publicClient) {
        console.log('Public client not found');
        return Response.json({ error: 'Server Error' }, { status: 500 });
      }

      let transaction;

      console.log(`Updating service ${params.id} with args`, userId, serviceDetails);

      const talentLayerClient = initializeTalentLayerClient();
      if (!talentLayerClient) {
        console.log('TalentLayer client not found');
        return Response.json({ error: 'Server Error' }, { status: 500 });
      }

      transaction = await talentLayerClient.service.update(serviceDetails, userId, parseInt(params.id));


      await incrementWeeklyTransactionCounter(user);

      return Response.json({ transaction: transaction }, { status: 201 });
    }
  } catch (error: any) {
    let message = 'Failed to create service';
    return Response.json({ message, error }, { status: 500 });
  }
}
