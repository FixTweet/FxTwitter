import { Constants } from '../constants';

/* Help populate API response for media */
export const processMedia = (media: TweetMedia): APIPhoto | APIVideo | null => {
  if (media.type === 'photo') {
    return {
      type: 'photo',
      url: media.media_url_https,
      width: media.original_info?.width,
      height: media.original_info?.height,
      altText: media.ext_alt_text || ''
    };
  } else if (media.type === 'video' || media.type === 'animated_gif') {
    /* Find the variant with the highest bitrate */
    const bestVariant = media.video_info?.variants?.reduce?.((a, b) =>
      (a.bitrate ?? 0) > (b.bitrate ?? 0) ? a : b
    );
    const result = {
      url: bestVariant?.url || '',
      thumbnail_url: media.media_url_https,
      duration: (media.video_info?.duration_millis || 0) / 1000,
      width: media.original_info?.width,
      height: media.original_info?.height,
      format: bestVariant?.content_type || '',
      type: media.type === 'animated_gif' ? 'gif' : 'video'
    } as APIGIF;
    if (media.type === 'animated_gif' && bestVariant?.url) {
      const url = handleGifUrl(bestVariant.url);
      if (url) {
        result.gif_url = url;
      }
    }
    return result;
  }
  return null;
};

/* Handler for mosaic (multi-image combiner) */
export const handleGifUrl = (gif_url: string): string | null => {
  const mediaDomains = Constants.MEDIA_PROXY_DOMAIN_LIST;
  let selectedDomain: string | null = null;
  while (selectedDomain === null && mediaDomains.length > 0) {
    const domain = mediaDomains[Math.floor(Math.random() * mediaDomains.length)];
    selectedDomain = domain;
  }

  /* Fallback if there are no Mosaic servers */
  if (selectedDomain === null) {
    return null;
  } else {
    return `https://${selectedDomain}/convert/gif?url=${gif_url}`;
  }
};
