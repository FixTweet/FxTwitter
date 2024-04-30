import { Constants } from '../constants';
import { Experiment, experimentCheck } from '../experiments';
import { handleQuote } from '../helpers/quote';
import { Strings } from '../strings';

export const renderVideo = (
  properties: RenderProperties,
  video: APIVideo
): ResponseInstructions => {
  const { status, userAgent, text } = properties;
  const instructions: ResponseInstructions = { addHeaders: [] };

  const all = status.media?.all as APIMedia[];

  /* This fix is specific to Discord not wanting to render videos that are too large,
      or rendering low quality videos too small.
      
      Basically, our solution is to cut the dimensions in half if the video is too big (> 1080p),
      or double them if it's too small. (<400p)
      
      We check both height and width so we can apply this to both horizontal and vertical videos equally*/

  let sizeMultiplier = 1;

  if (video.width > 1920 || video.height > 1920) {
    sizeMultiplier = 0.5;
  }
  if (video.width < 400 && video.height < 400) {
    sizeMultiplier = 2;
  }

  /* Like photos when picking a specific one (not using mosaic),
      we'll put an indicator if there are more than one video */
  if (all && all.length > 1 && (userAgent?.indexOf('Telegram') ?? 0) > -1) {
    const baseString =
      all.length === status.media?.videos?.length ? Strings.VIDEO_COUNT : Strings.MEDIA_COUNT;
    const videoCounter = baseString.format({
      number: String(all.indexOf(video) + 1),
      total: String(all.length)
    });

    instructions.siteName = `${Constants.BRANDING_NAME} - ${videoCounter}`;
  }

  instructions.authorText = status.translation?.text || text || '';

  if (instructions.authorText.length < 40 && status.quote) {
    instructions.authorText += `\n${handleQuote(status.quote)}`;
  }

  let url = video.url;

  if (
    experimentCheck(Experiment.TRANSCODE_GIFS, !!Constants.GIF_TRANSCODE_DOMAIN) &&
    !userAgent?.includes('Telegram') &&
    video.type === 'gif'
  ) {
    url = video.url.replace(
      Constants.TWITTER_VIDEO_BASE,
      `https://${Constants.GIF_TRANSCODE_DOMAIN}`
    );
    console.log('We passed checks for transcoding GIFs, feeding embed url', url);
  }

  /* Push the raw video-related headers */
  instructions.addHeaders = [
    `<meta property="twitter:player:height" content="${video.height * sizeMultiplier}"/>`,
    `<meta property="twitter:player:width" content="${video.width * sizeMultiplier}"/>`,
    `<meta property="twitter:player:stream" content="${url}"/>`,
    `<meta property="twitter:player:stream:content_type" content="${video.format}"/>`,
    `<meta property="og:video" content="${url}"/>`,
    `<meta property="og:video:secure_url" content="${url}"/>`,
    `<meta property="og:video:height" content="${video.height * sizeMultiplier}"/>`,
    `<meta property="og:video:width" content="${video.width * sizeMultiplier}"/>`,
    `<meta property="og:video:type" content="${video.format}"/>`,
    `<meta property="og:image" content="${video.thumbnail_url}"/>`,
    `<meta property="twitter:image" content="0"/>`
  ];

  return instructions;
};
