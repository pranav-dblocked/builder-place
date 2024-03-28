import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';
import { sendVerificationEmail } from '../../modules/BuilderPlace/request';
import { createVerificationEmailToast } from '../../modules/BuilderPlace/utils/toast';
import { useContext } from 'react';
import UserContext from '../../modules/BuilderPlace/context/UserContext';
import BuilderPlaceContext from '../../modules/BuilderPlace/context/BuilderPlaceContext';

function SubmitButton({
  isSubmitting,
  label = 'Create',
  checkEmailStatus = false,
}: {
  isSubmitting: boolean;
  label?: string;
  checkEmailStatus?: boolean;
}) {
  const { isConnected } = useAccount();
  const { open: openConnectModal } = useWeb3Modal();
  const { user } = useContext(UserContext);
  const { builderPlace } = useContext(BuilderPlaceContext);

  const handleSendVerificationEmail = async () => {
    const domain = builderPlace?.subdomain || builderPlace?.customDomain;
    if (user && domain) {
      await sendVerificationEmail(user.email, user.id.toString(), user.name, domain);
      await createVerificationEmailToast();
    }
  };

  return (
    <div className='flex flex-row justify-between items-center'>
      {isSubmitting ? (
        <button
          disabled
          type='submit'
          className='py-2 px-5 mr-2 bg-primary text-primary opacity-50 rounded-xl border inline-flex items-center'>
          <svg
            role='status'
            className='inline mr-2 w-4 h-4 text-base-content animate-spin '
            viewBox='0 0 100 101'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'>
            <path
              d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
              fill='currentColor'
            />
            <path
              d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
              fill='#11112a'
            />
          </svg>
          Loading...
        </button>
      ) : isConnected ? (
        <div className='flex flex-col w-full'>
          <button type='submit' className='w-full px-5 py-2 rounded-xl bg-primary text-primary'>
            {label}
          </button>
          {checkEmailStatus && !user?.isEmailVerified && (
            <p className={'mt-1 text-base-content font-alt text-xs font-normal opacity-60'}>
              Want gassless experience?&nbsp;
              <button
                onClick={() => handleSendVerificationEmail()}
                className='text-base-content font-alt text-xs font-normal opacity-70 hover:opacity-50 focus:outline-none focus:underline'>
                Verify your email !
              </button>
            </p>
          )}
        </div>
      ) : (
        <button
          onClick={() => {
            openConnectModal();
          }}
          type='button'
          className='grow px-5 py-2 rounded-xl bg-info text-base-content hover:bg-base-200  '>
          {'Connect first'}
        </button>
      )}
    </div>
  );
}

export default SubmitButton;
