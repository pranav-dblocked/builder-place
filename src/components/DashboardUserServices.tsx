import { useContext } from 'react';
import useServices from '../hooks/useServices';
import BuilderPlaceContext from '../modules/BuilderPlace/context/BuilderPlaceContext';
import UserContext from '../modules/BuilderPlace/context/UserContext';
import { ServiceStatusEnum } from '../types';
import Loading from './Loading';
import Notification from './Notification';
import ServiceItem from './ServiceItem';

interface IProps {
  userId: string;
  type: 'buyer' | 'seller';
  status?: ServiceStatusEnum;
}

function DashboardUserServices({ userId, type, status }: IProps) {
  const { user } = useContext(UserContext);
  const { builderPlace } = useContext(BuilderPlaceContext);

  const { services, loading } = useServices(
    status,
    type == 'buyer' ? userId : undefined,
    type == 'seller' ? userId : undefined,
    undefined,
    undefined,
    builderPlace?.talentLayerPlatformId,
  );

  if (loading) {
    return <Loading />;
  }

  if (services.length === 0) {
    if (type == 'buyer') {
      return (
        <>
          <h2 className='pb-4 text-base font-bold break-all'>missions posted</h2>
          <Notification
            title='post your first mission!'
            text='post something your team needs help with'
            link='/work/create'
            linkText='post a mission'
            color='primary'
            imageUrl={user?.picture}
          />
        </>
      );
    }

    if (type == 'seller') {
      return (
        <>
          <h2 className='pb-4 text-base font-bold break-all'>missions applied to</h2>
          <Notification
            title='post your first proposal!'
            text='check the current missions and apply to them'
            link='/'
            linkText='check open missions'
            color='primary'
            imageUrl={user?.picture}
          />
        </>
      );
    }
  }

  return (
    <>
      <h2 className='pb-4 text-base font-bold break-all'>
        {type == 'buyer' ? 'missions posted' : 'posts applied to'}
      </h2>
      <div className='grid grid-cols-1 gap-4'>
        {services.map((service, i) => {
          return <ServiceItem service={service} key={i} />;
        })}
      </div>

      {services.length === 20 && (
        <a
          href='#'
          className='px-5 py-2  border border-zinc-600 rounded-full text-content hover:text-base hover:bg-base-200'>
          Load More
        </a>
      )}
    </>
  );
}

export default DashboardUserServices;
