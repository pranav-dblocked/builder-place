import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { useColor } from 'react-color-palette';
import * as Yup from 'yup';
import BuilderPlaceContext from '../../modules/BuilderPlace/context/BuilderPlaceContext';
import useUpdatePlatform from '../../modules/BuilderPlace/hooks/platform/useUpdatePlatform';
import {
  JobConditionsChainIdEnum,
  JobPostingConditions,
  iBuilderPlacePalette,
} from '../../modules/BuilderPlace/types';
import { IMutation } from '../../types';
import { themes } from '../../utils/themes';
import { showErrorTransactionToast } from '../../utils/toast';
import CustomizePalette from '../CustomizePalette';
import DefaultPalettes from '../DefaultPalettes';
import SubdomainInput from '../Form/SubdomainInput';
import UploadImage from '../UploadImage';
import JobPostingConditionsFieldArray, { TempFormValues } from './JobPostingConditionsFieldArray';

export interface IConfigurePlaceFormValues {
  subdomain: string;
  palette?: iBuilderPlacePalette;
  logo?: string;
  name: string;
  baseline: string;
  about: string;
  aboutTech: string;
  icon?: string;
  cover?: string;
  jobPostingConditions?: JobPostingConditions;
  tempFormValues?: TempFormValues;
}

export interface IConfigurePlace
  extends IMutation<Omit<IConfigurePlaceFormValues, keyof TempFormValues>> {}

const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;

const validationSchema = Yup.object({
  subdomain: Yup.string().required('Subdomain is required'),
  //TODO check Yup, try to make the JobConditions work ? Problème, quand on push on ne submit pas,
  // donc en théorie ça ne passera pas. Faut juste essayer de faire en sorte que
  // les err messages ne reset pas à chaque change. Un genre de prevent default ?

  // tempFormValues: Yup.object({
  //   tempNftAddress: Yup.string().matches(ethAddressRegex, 'Invalid Ethereum address').notRequired(),
  //
  //   tempTokenAddress: Yup.string()
  //     .matches(ethAddressRegex, 'Invalid Ethereum address')
  //     .notRequired(),
  //
  //   tempTokenAmount: Yup.number().positive('Amount must be positive').notRequired(),
  // }),
});

/**
 * @dev This form aims to be used for all platform updates by a platform collaborator.
 *
 * Logicall flow:
 *
 * IF user has a wallet connected
 *      EXECUTE REQUEST: We try to get from DB his user profile & Platform Data
 *      IF user has profile in DB and is a Collaborator of the platform
 *         execute success callback
 *      ELSE
 *          Access Denied Displayed
 *  ELSE
 *     Access Denied Displayed
 */
const ConfigurePlatformForm = () => {
  const { builderPlace } = useContext(BuilderPlaceContext);
  const [palette, setPalette] = useState<iBuilderPlacePalette | undefined>(builderPlace?.palette);
  const [colorName, setColorName] = useState('primary');
  const [color, setColor] = useColor(
    palette ? palette[colorName as keyof iBuilderPlacePalette] : '#FF71A2',
  );
  const { updatePlatform } = useUpdatePlatform();

  const initialValues: IConfigurePlaceFormValues = {
    subdomain:
      builderPlace?.subdomain?.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN as string}`, '') ||
      '',
    logo: builderPlace?.logo || '',
    palette,
    name: builderPlace?.name || '',
    baseline: builderPlace?.baseline || '',
    about: builderPlace?.about || '',
    aboutTech: builderPlace?.aboutTech || '',
    icon: builderPlace?.icon || '',
    cover: builderPlace?.cover || '',
    jobPostingConditions: builderPlace?.jobPostingConditions || {
      allowPosts: false,
      conditions: [],
    },
    tempFormValues: {
      tempNftAddress: '',
      tempTokenAddress: '',
      tempNftContractName: '',
      tempTokenContractName: '',
      tempTokenAmount: 0,
      tempNftChainId: JobConditionsChainIdEnum.ETHEREUM,
      tempTokenChainId: JobConditionsChainIdEnum.ETHEREUM,
    },
  };

  useEffect(() => {
    let timeoutId: string | number | NodeJS.Timeout | undefined;
    // Prevents max stack depth being called
    const delayedEffect = () => {
      setPalette(prevPalette => {
        if (!prevPalette) return;
        return { ...prevPalette, [colorName]: color.hex };
      });
    };

    timeoutId = setTimeout(delayedEffect, 10);
    return () => clearTimeout(timeoutId);
  }, [color]);

  useEffect(() => {
    if (!palette) return;

    document.documentElement.style.setProperty('--primary', palette.primary);
    document.documentElement.style.setProperty('--primary-50', palette.primary + '60');
    document.documentElement.style.setProperty('--primary-focus', palette.primaryFocus);
    document.documentElement.style.setProperty('--primary-content', palette.primaryContent);
    document.documentElement.style.setProperty('--base-100', palette.base100);
    document.documentElement.style.setProperty('--base-200', palette.base200);
    document.documentElement.style.setProperty('--base-300', palette.base300);
    document.documentElement.style.setProperty('--base-content', palette.baseContent);
    document.documentElement.style.setProperty('--info', palette.info);
    document.documentElement.style.setProperty('--info-content', palette.infoContent);
    document.documentElement.style.setProperty('--success', palette.success);
    document.documentElement.style.setProperty('--success-50', palette.success + '60');
    document.documentElement.style.setProperty('--success-content', palette.successContent);
    document.documentElement.style.setProperty('--warning', palette.warning);
    document.documentElement.style.setProperty('--warning-content', palette.warningContent);
    document.documentElement.style.setProperty('--error', palette.error);
    document.documentElement.style.setProperty('--error-content', palette.errorContent);
  }, [palette]);

  const handleSubmit = async (
    values: IConfigurePlaceFormValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
  ) => {
    try {
      setSubmitting(true);
      await updatePlatform(values);
    } catch (error: any) {
      console.log('CATCH error', error);
      showErrorTransactionToast(error.message);
    } finally {
      setTimeout(() => {
        setSubmitting(false);
      }, 1000);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize={true}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}>
      {({ isSubmitting, setFieldValue, setFieldError, values }) => (
        <Form>
          <div className='grid grid-cols-1 gap-6'>
            <div>
              <label className='block'>
                <span className='font-bold text-md'>organization name</span>
                <Field
                  type='text'
                  id='name'
                  name='name'
                  className='mt-1 mb-1 block w-full rounded-xl border-2 border-info bg-base-200 shadow-sm focus:ring-opacity-50'
                  placeholder='your organization name goes here'
                />
              </label>
              <span className='text-red-500'>
                <ErrorMessage name='name' />
              </span>
            </div>

            <div>
              <label className='block'>
                <span className='font-bold text-md'>organization baseline</span>
                <Field
                  type='text'
                  id='baseline'
                  name='baseline'
                  className='mt-1 mb-1 block w-full rounded-xl border-2 border-info bg-base-200 shadow-sm focus:ring-opacity-50'
                  placeholder='your organization baseline'
                />
              </label>
              <span className='text-red-500'>
                <ErrorMessage name='baseline' />
              </span>
            </div>

            <div>
              <label className='block'>
                <span className='font-bold text-md'>about your organization</span>
                <Field
                  as='textarea'
                  id='about'
                  name='about'
                  rows='9'
                  className='mt-1 mb-1 block w-full rounded-xl border-2 border-info bg-base-200 shadow-sm focus:ring-opacity-50'
                  placeholder='tell everyone about what you work on and why you’re doing it (ps: open-source contributors love to hear about your mission and vision)'
                />
              </label>
              <p className='font-alt text-xs font-normal opacity-60'>
                <span className='text-base-content'>
                  This supports markdown format. Learn more about how to write markdown{' '}
                  <a
                    href='https://stackedit.io/app#'
                    target='_blank'
                    className='underline text-info'>
                    here
                  </a>
                  .
                </span>
              </p>
              <span className='text-red-500'>
                <ErrorMessage name='about' />
              </span>
            </div>

            <div>
              <label className='block'>
                <span className='font-bold text-md'>about your tech</span>
                <Field
                  as='textarea'
                  id='aboutTech'
                  name='aboutTech'
                  rows='9'
                  className='mt-1 mb-1 block w-full rounded-xl border-2 border-info bg-base-200 shadow-sm focus:ring-opacity-50'
                />
              </label>
              <p className='font-alt text-xs font-normal opacity-60'>
                <span className='text-base-content'>
                  This supports markdown format. Learn more about how to write markdown{' '}
                  <a
                    href='https://stackedit.io/app#'
                    target='_blank'
                    className='underline text-info'>
                    here
                  </a>
                  .
                </span>
              </p>
              <span className='text-red-500'>
                <ErrorMessage name='aboutTech' />
              </span>
            </div>

            <SubdomainInput />

            <UploadImage
              fieldName='logo'
              label='logo'
              legend='rectangle format, used in top of your place'
              src={values.logo}
              setFieldValue={setFieldValue}
            />

            <UploadImage
              fieldName='icon'
              label='icon'
              legend='square format - optimally 512x512'
              src={values.icon}
              setFieldValue={setFieldValue}
            />
            <p className='font-alt text-xs font-normal opacity-60'>
              <span className='text-base-content'>
                Use for homepage header and for your PWA icon. More info{' '}
                <a
                  href='https://web.dev/explore/progressive-web-apps'
                  target='_blank'
                  className='underline text-info'>
                  here
                </a>
                .
              </span>
            </p>

            <UploadImage
              fieldName='cover'
              label='cover'
              legend='large rectangle format, used in top of your place'
              src={values.cover}
              setFieldValue={setFieldValue}
            />

            <DefaultPalettes
              onChange={palette => {
                setPalette(themes[palette as keyof typeof themes]);
              }}
            />

            {palette && (
              <CustomizePalette
                palette={palette}
                color={color}
                setColor={setColor}
                setColorName={setColorName}
              />
            )}

            <JobPostingConditionsFieldArray
              existingJobPostingConditions={values.jobPostingConditions}
              tempFormValues={values.tempFormValues}
              setFieldValue={setFieldValue}
              setFieldError={setFieldError}
            />

            {isSubmitting ? (
              <button
                disabled
                type='submit'
                className='grow px-5 py-2 rounded-xl bg-primary-50 text-primary'>
                Loading...
              </button>
            ) : (
              <button type='submit' className='grow px-5 py-2 rounded-xl bg-primary text-primary'>
                Sign and validate
              </button>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default ConfigurePlatformForm;
