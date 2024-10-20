import { Constants } from '../constants';
import { DataProvider } from '../enum';

const getDomain = (twitterId: string, provider: DataProvider): string | null => {
  let mosaicDomains: string[] = []
  if (provider === DataProvider.Twitter) {
    mosaicDomains = Constants.MOSAIC_DOMAIN_LIST;
  } else if (provider === DataProvider.Bsky) {
    mosaicDomains = Constants.MOSAIC_BSKY_DOMAIN_LIST;
  }

  if (mosaicDomains.length === 0) {
    return null;
  }

  let hash = 0;
  for (let i = 0; i < twitterId.length; i++) {
    const char = twitterId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }
  return mosaicDomains[Math.abs(hash) % mosaicDomains.length];
};

/* Handler for mosaic (multi-image combiner) */
export const handleMosaic = async (
  mediaList: APIPhoto[],
  id: string,
  provider: DataProvider
): Promise<APIMosaicPhoto | null> => {
  const selectedDomain: string | null = getDomain(id, provider);

  /* Fallback if there are no Mosaic servers */
  if (selectedDomain === null) {
    return null;
  } else {
    let mosaicMedia: string[] = [];
    if (provider === DataProvider.Twitter) {
      mosaicMedia = mediaList.map(
        media => media.url?.match(/(?<=\/media\/)[\w-]+(?=[.?])/g)?.[0] || ''
      );
    } else if (provider === DataProvider.Bsky) {
      mosaicMedia = mediaList.map(
        media => (media.url?.match(/did:plc:[\w/]+/g)?.[0] || '').replace('/', '_')
      );
    }
    const baseUrl = `https://${selectedDomain}/`;
    let path = '';

    for (let j = 0; j < 4; j++) {
      if (typeof mosaicMedia[j] === 'string') {
        path += `/${mosaicMedia[j]}`;
      }
    }

    return {
      type: 'mosaic_photo',
      formats: {
        jpeg: `${baseUrl}jpeg/${id}${path}`,
        webp: `${baseUrl}webp/${id}${path}`
      }
    } as APIMosaicPhoto;
  }
};
