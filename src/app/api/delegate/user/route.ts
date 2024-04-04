import { recoverMessageAddress } from 'viem';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { getConfig } from '../../../../config';
import { getDelegationSigner, getPublicClient } from '../../../utils/delegate';
import TalentLayerID from '../../../../contracts/ABI/TalentLayerID.json';
import TalentLayerIdUtils from '../../../../contracts/ABI/TalentLayerIdUtils.json';

export interface IUserMintForAddress {
  chainId: number;
  handle: string;
  handlePrice: string;
  userAddress: string;
  platformId: string;
  signature: `0x${string}` | Uint8Array;
  addDelegateAndTransferId?: boolean;
}

/**
 * POST /api/delegate/user
 */
export async function POST(req: Request) {
  console.log('POST');
  const body: IUserMintForAddress = await req.json();
  console.log('json', body);
  const config = getConfig(body.chainId);

  if (process.env.NEXT_PUBLIC_ACTIVATE_DELEGATE_MINT !== 'true') {
    return Response.json({ message: 'Delegation for Mint is not activated' }, { status: 500 });
  }

  // @TODO: move it to a middleware and apply to all POST and PUT ?
  const signatureAddress = await recoverMessageAddress({
    message: `connect with ${body.userAddress}`,
    signature: body.signature,
  });

  if (signatureAddress !== body.userAddress) {
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

    let transaction, userId;

    /**
     * If addDelegateAndTransferId is true, we mint the TlId for the user, add the delegator address as delegate, then transfer it to them.
     * @dev: This requires the delegator address not to have an existing TlId.
     */
    if (body.addDelegateAndTransferId) {
      const tx = await walletClient.writeContract({
        address: config.contracts.talentLayerIdUtils,
        abi: TalentLayerIdUtils.abi,
        functionName: 'mintDelegateAndTransfer',
        args: [
          body.userAddress,
          walletClient.account.address,
          BigInt(body.platformId),
          body.handle,
        ],
        value: BigInt(body.handlePrice),
      });

      console.log(`Minting TalentLayer Id for address ${body.userAddress}...`);

      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      console.log('Mint Transaction Status', receipt.status);

      await publicClient.waitForTransactionReceipt({
        confirmations: 1,
        hash: tx,
      });

      // Get Minted UserId
      userId = await publicClient.readContract({
        address: config.contracts.talentLayerId,
        abi: TalentLayerID.abi,
        functionName: 'ids',
        args: [body.userAddress],
      });

      console.log(
        `Minted id: ${userId} for user ${body.userAddress} and added ${walletClient.account.address} as delegate`,
      );
    } else {
      transaction = await walletClient.writeContract({
        address: config.contracts.talentLayerId,
        abi: TalentLayerID.abi,
        functionName: 'mintForAddress',
        args: [body.userAddress, body.platformId, body.handle],
        value: BigInt(body.handlePrice),
      });

      console.log(`Minted TalentLayer Id for address ${body.userAddress}`);

      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash: transaction });
      console.log('Mint Transaction Status', receipt.status);

      // Get Minted UserId
      userId = await publicClient.readContract({
        address: config.contracts.talentLayerId,
        abi: TalentLayerID.abi,
        functionName: 'ids',
        args: [body.userAddress],
      });

      console.log(`Minted id: ${userId} for user ${body.userAddress}`);
    }

    return Response.json({ transaction: transaction, userId: String(userId) }, { status: 201 });
  } catch (error: any) {
    console.log('CATCH error', error);
    // @TODO: move error handle to a middleware ? or factorize it ?
    let message = 'Failed to mint ID';
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = (error.meta?.target as string)[0] || 'data';
        message = `A platform already exists with this ${target}`;
      }
    }

    return Response.json({ message, error }, { status: 500 });
  }
}