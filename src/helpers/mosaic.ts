import { Constants } from '../constants';

/* Handler for mosaic (multi-image combiner) */
export const handleMosaic = async (
  mediaList: APIPhoto[],
  id: string
): Promise<APIMosaicPhoto | null> => {
  const mosaicDomains = Constants.MOSAIC_DOMAIN_LIST;
  let selectedDomain: string | null = null;
  while (selectedDomain === null && mosaicDomains.length > 0) {
    const domain = mosaicDomains[Math.floor(Math.random() * mosaicDomains.length)];
    selectedDomain = domain;
  }

  /* Fallback if there are no Mosaic servers */
  if (selectedDomain === null) {
    return null;
  } else {
    const mosaicMedia = mediaList.map(
      media => media.url?.match(/(?<=\/media\/)[\w-]+(?=[.?])/g)?.[0] || ''
    );
    const baseUrl = `https://${selectedDomain}/`;
    let path = '';

    for (let j = 0; j < 4; j++) {
      if (typeof mosaicMedia[j] === 'string') {
        path += `/${mosaicMedia[j]}`;
      }
    }

    return {
      WARNING: 'height and width of mosaic photos are deprecated and will be removed.',
      height: 0,
      width: 0,
      formats: {
        jpeg: `${baseUrl}jpeg/${id}${path}`,
        webp: `${baseUrl}webp/${id}${path}`
      }
    } as unknown as APIMosaicPhoto;
  }
};
