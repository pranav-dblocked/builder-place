import { useContext } from 'react';
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import BuilderPlaceContext from '../../context/BuilderPlaceContext';
import { toggleDelegation } from '../../../../contracts/toggleDelegation';
import { useConfig } from '../../../../hooks/useConfig';
import { useMutation } from 'react-query';
import axios, { AxiosResponse } from 'axios';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import TalentLayerContext from '../../../../context/talentLayer';
import { IAddBuilderPlaceCollaborator } from '../../../../components/Form/CollaboratorForm';

const useAddCollaborator = () => {
  const chainId = useChainId();
  const config = useConfig();
  const { data: walletClient } = useWalletClient({ chainId });
  const publicClient = usePublicClient({ chainId });
  const { builderPlace } = useContext(BuilderPlaceContext);
  const { address } = useAccount();
  const { user: talentLayerUser } = useContext(TalentLayerContext);
  const collaboratorMutation = useMutation(
    async (body: IAddBuilderPlaceCollaborator): Promise<AxiosResponse<{ id: string }>> => {
      return await axios.post(`/api/collaborators`, body);
    },
  );

  const addCollaborator = async (collaboratorAddress: string): Promise<void> => {
    if (!walletClient || !address || !talentLayerUser?.id || !builderPlace) {
      throw new Error('Please connect your wallet first');
    }

    if (
      collaboratorAddress.toLocaleLowerCase() === builderPlace?.owner?.address?.toLocaleLowerCase()
    ) {
      throw new Error('Already owner');
    }

    /**
     * @dev Sign message to prove ownership of the address
     */
    const signature = await walletClient.signMessage({
      account: address,
      message: `connect with ${address}`,
    });

    /**
     * @dev Add new collaborator to the BuilderPlace
     * The collaborator must have a BuilderPlace profile & TalentLayer Id
     */
    await collaboratorMutation.mutateAsync({
      data: {
        collaboratorAddress: collaboratorAddress,
        builderPlaceId: builderPlace.id,
        ownerTalentLayerId: talentLayerUser.id,
      },
      signature: signature,
      address: address,
      domain: `${window.location.hostname}${
        window.location.port ? ':' + window.location.port : ''
      }`,
    });

    // if address is not delegated yet on chain
    if (!talentLayerUser.delegates?.includes(collaboratorAddress.toLowerCase())) {
      /**
       * @dev Add the new collaborator as a delegate to the BuilderPlace owner
       */
      await toggleDelegation(
        chainId,
        talentLayerUser.id,
        config,
        collaboratorAddress,
        publicClient,
        walletClient,
        true,
      );
    }
  };
  return { addCollaborator };
};

export default useAddCollaborator;
