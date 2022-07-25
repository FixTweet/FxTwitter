import { Constants } from './constants';

export const handleMosaic = async (
  mediaList: TweetMedia[],
  userAgent: string
): Promise<TweetMedia> => {
  let mosaicDomains = Constants.MOSAIC_DOMAIN_LIST;
  let selectedDomain: string | null = null;
  while (selectedDomain === null && mosaicDomains.length > 0) {
    // fetch /ping on a random domain
    let domain = mosaicDomains[Math.floor(Math.random() * mosaicDomains.length)];
    // let response = await fetch(`https://${domain}/ping`);
    // if (response.status === 200) {
    selectedDomain = domain;
    // } else {
    //   mosaicDomains = mosaicDomains.filter(d => d !== domain);
    //   console.log(`${domain} is not available, removing from list`);
    // }
  }

  // Fallback if all Mosaic servers are down
  if (selectedDomain === null) {
    return mediaList[0];
  } else {
    // console.log('mediaList', mediaList);
    let mosaicMedia = mediaList.map(
      media =>
        media.media_url_https?.match(/(?<=\/media\/)[a-zA-Z0-9_\-]+(?=[\.\?])/g)?.[0] ||
        ''
    );
    // console.log('mosaicMedia', mosaicMedia);
    // TODO: use a better system for this, 0 gets png 1 gets webp, usually
    let constructUrl = `https://${selectedDomain}/${
      userAgent.indexOf('Telegram') > -1 ? 'jpeg' : 'webp'
    }/0`;
    if (mosaicMedia[0]) {
      constructUrl += `/${mosaicMedia[0]}`;
    }
    if (mosaicMedia[1]) {
      constructUrl += `/${mosaicMedia[1]}`;
    }
    if (mosaicMedia[2]) {
      constructUrl += `/${mosaicMedia[2]}`;
    }
    if (mosaicMedia[3]) {
      constructUrl += `/${mosaicMedia[3]}`;
    }

    console.log(`Mosaic URL: ${constructUrl}`);

    return {
      media_url_https: constructUrl,
      original_info: {
        height: mediaList.reduce((acc, media) => acc + media.original_info?.height, 0),
        width: mediaList.reduce((acc, media) => acc + media.original_info?.width, 0)
      },
      type: 'photo'
    } as TweetMedia;
  }
};
