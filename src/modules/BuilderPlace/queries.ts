import { IBuilderPlace } from './types';
import { getBuilderPlaceByDomain } from './actions/builderPlace';

// Used inside getServerSideProps
export const getBuilderPlace = async (domain: string): Promise<IBuilderPlace> => {
  console.log('serverProps', domain);
  let builderPlace;
  try {
    builderPlace = await getBuilderPlaceByDomain(domain);
  } catch (error: any) {
    console.log(error.message);
  }

  if (!builderPlace) {
    throw new Error(`BuilderPlace not found for domain ${domain}`);
  }

  const serializedBuilderPlace = JSON.parse(JSON.stringify(builderPlace));

  console.log({
    serializedBuilderPlace,
  });
  return serializedBuilderPlace;
};
