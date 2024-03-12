import { Context } from "hono";

/* Help populate API response for media */
export const processMedia = (c: Context, media: TweetMedia): APIPhoto | APIVideo | null => {
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
       (c.req.header('User-Agent')?.includes('Telegram') || !a.url.includes('/hevc/')) && (a.bitrate ?? 0) > (b.bitrate ?? 0) ? a : b
    );
    return {
      url: bestVariant?.url || '',
      thumbnail_url: media.media_url_https,
      duration: (media.video_info?.duration_millis || 0) / 1000,
      width: media.original_info?.width,
      height: media.original_info?.height,
      format: bestVariant?.content_type || '',
      type: media.type === 'animated_gif' ? 'gif' : 'video',
      variants: media.video_info?.variants ?? []
    };
  }
  return null;
};
