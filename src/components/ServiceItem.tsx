import Link from 'next/link';
import { IService } from '../types';
import { formatDaysAgo } from '../utils/dates';
import TokenAmount from './TokenAmount';

function limitText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength - 3) + '...';
}

function ServiceItem({
  service,
  embedded,
  view = 1,
}: {
  service: IService;
  embedded?: boolean;
  view?: number;
}) {
  const createdAt = Number(service.createdAt) * 1000;
  const daysAgo = formatDaysAgo(createdAt);

  return (
    <>
      {/* LIST VIEW */}
      {view === 1 && (
        <div className='relative flex flex-row gap-2 rounded-2xl p-6 border border-info text-base-content bg-base-100 mb-5'>
          {service.proposals && (
            <div className='absolute top-[-10px] right-[-10px] bg-primary text-primary text-xs rounded-full px-3 py-1'>
              {service.proposals.length}
            </div>
          )}
          <div className='flex flex-col items-top justify-between gap-4 w-full'>
            <div className='flex items-center justify-between gap-4'>
              <p className='font-bold break-all'>{service.description?.title}</p>
            </div>
            {/* {service.description?.about && (
              <div className='flex flex-col justify-start items-start gap-4'>
                <div className='flex items-center justify-start'>
                  <div className='flex flex-col'>
                    <p className='text-sm break-all'>{limitText(service.description?.about, 200)}</p>
                  </div>
                </div>
              </div>
            )} */}

            <div className='flex flex-wrap flew-row justify-between items-center pt-2'>
              <div className='flex flex-wrap gap-3 items-center'>
                <p className='text-sm'>
                  🗓️ <span className='text-base-content-50'>{daysAgo}</span>
                </p>
                <p>
                  <span className='w-[6px] h-[6px] rounded-full bg-base-300 block'></span>
                </p>
                {service.description?.rateToken && service.description?.rateAmount && (
                  <p className='text-sm max-w-[150px]'>
                    💰{' '}
                    <span className='text-base-content-50'>
                      <TokenAmount
                        amount={service.description.rateAmount}
                        address={service.description.rateToken}
                      />
                    </span>
                  </p>
                )}
              </div>
              <Link
                className='text-primary text-center bg-primary hover:opacity-70 px-5 py-2.5 rounded-xl text-md w-full sm:w-auto mt-4 sm:mt-0'
                href={`/work/${service.id}`}
                target={embedded ? 'blank' : ''}>
                view post
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TABLE VIEW */}
      {view === 2 && (
        <tr className='bg-base-100 hover:bg-base-200'>
          <td className='border border-info p-2 break-all text-left '>
            {service.description?.title}
          </td>
          <td className='border border-info p-2'>{daysAgo}</td>
          <td className='border border-info p-2'>
            {service.description?.rateToken && service.description?.rateAmount && (
              <TokenAmount
                amount={service.description.rateAmount}
                address={service.description.rateToken}
              />
            )}
          </td>

          <td className='border border-info p-2'>
            <Link
              className='text-base-content hover:opacity-70 underline'
              href={`/work/${service.id}`}
              target={embedded ? 'blank' : ''}>
              View Post
            </Link>
          </td>
        </tr>
      )}
    </>
  );
}

export default ServiceItem;
