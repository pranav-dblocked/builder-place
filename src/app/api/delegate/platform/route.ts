import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { recoverMessageAddress } from 'viem';
import { getConfig } from '../../../../config';
import TalentLayerPlatformID from '../../../../contracts/ABI/TalentLayerPlatformID.json';
import { getUserByAddress } from '../../../../modules/BuilderPlace/actions/user';
import { getDelegationSigner, getPublicClient } from '../../../utils/delegate';
import { initializeTalentLayerClient } from '../../../../utils/delegate';

export interface IPlatformMintForAddress {
  platformName: string;
  address: string;
  userTalentLayerId: string;
  chainId: number;
  signature: `0x${string}` | Uint8Array;
}

const MAX_RETRIES = 5;

/**
 * POST /api/delegate/platform
 * @note: The delegate address executing the mint function needs to have the MINT_ROLE
 */
export async function POST(req: Request) {
  console.log('POST');
  const body: IPlatformMintForAddress = await req.json();
  console.log('json', body);
  const config = getConfig(body.chainId);

  if (process.env.NEXT_PUBLIC_ACTIVATE_DELEGATE !== 'true') {
    return Response.json({ message: 'Delegation is not activated' }, { status: 500 });
  }

  // @TODO: move it to a middleware and apply to all POST and PUT ?
  const signatureAddress = await recoverMessageAddress({
    message: `connect with ${body.address}`,
    signature: body.signature,
  });

  const user = await getUserByAddress(signatureAddress);

  if (user?.talentLayerId !== body.userTalentLayerId) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const walletClient = await getDelegationSigner();
    if (!walletClient) {
      console.log('Wallet client not found');
      return Response.json({ error: 'Server Error' }, { status: 500 });
    }

    const publicClient = getPublicClient();
    if (!publicClient) {
      console.log('Public client not found');
      return Response.json({ error: 'Server Error' }, { status: 500 });
    }

    const mintFee = await publicClient.readContract({
      address: config.contracts.talentLayerPlatformId,
      abi: TalentLayerPlatformID.abi,
      functionName: 'mintFee',
    });

    console.log('MintFee', mintFee);

    const talentLayerClient = initializeTalentLayerClient();
    if (!talentLayerClient) {
      console.log('TalentLayer client not found');
      return Response.json({ error: 'Server Error' }, { status: 500 });
    }

    const txHash = await talentLayerClient.platform.mintForAddress(
      body.platformName,
      body.address,
      mintFee
    );

    console.log('tx hash', txHash);

    console.log(`Minting Platform Id for address ${body.address}...`);

    let id: bigint = 0n;
    let retries = 0;
    let confirmations = 1;

    while (id === 0n && retries < MAX_RETRIES) {
      console.log('Waiting for transaction to be mined, try: ', retries + 1);
      console.log('Confirmations', confirmations);

      // Wait for transaction to be mined - increase block confirmations each time
      const receipt = await publicClient.waitForTransactionReceipt({
        confirmations,
        hash: txHash,
      });

      console.log('Mint Transaction Status', receipt.status);

      // Get Minted PlatformId
      id = (await publicClient.readContract({
        address: config.contracts.talentLayerPlatformId,
        abi: TalentLayerPlatformID.abi,
        functionName: 'ids',
        args: [body.address],
      })) as bigint;

      console.log('Platform id', id);

      retries++;
      confirmations++;
    }

    return Response.json({ transaction: txHash, platformId: String(id) }, { status: 201 });
  } catch (error: any) {
    // @TODO: move error handle to a middleware ? or factorize it ?
    let message = 'Failed to create plaform';
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = (error.meta?.target as string)[0] || 'data';
        message = `A platform already exists with this ${target}`;
      }
    }

    return Response.json({ message, error }, { status: 500 });
  }
}
