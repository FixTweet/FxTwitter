import { Constants } from "../constants";
import { Strings } from "../strings";

export const renderPhoto = (properties: RenderProperties, photo: APIPhoto | APIMosaicPhoto): ResponseInstructions => {
  const { tweet,  engagementText, authorText, isOverrideMedia, userAgent } = properties;
  const instructions: ResponseInstructions = { addHeaders: [] };

  if (!tweet.media?.mosaic || isOverrideMedia) {

    photo = photo as APIPhoto;
    
    const all = tweet.media?.all as APIMedia[];
    const baseString = all.length === tweet.media?.photos?.length ? Strings.PHOTO_COUNT : Strings.MEDIA_COUNT;
    const photoCounter = baseString.format({
      number: String(all.indexOf(photo) + 1),
      total: String(all.length)
    });

    console.log('Telegram', userAgent?.indexOf('Telegram'))
    if (authorText === Strings.DEFAULT_AUTHOR_TEXT || (userAgent?.indexOf('Telegram') ?? 0) > -1) {
      instructions.authorText = photoCounter;
    } else {
      instructions.authorText = `${authorText}${authorText ? '   ―   ' : ''}${photoCounter}`;
    }

    if (engagementText && (userAgent?.indexOf('Telegram') ?? 0) === -1) {
      instructions.siteName = `${Constants.BRANDING_NAME} - ${engagementText} - ${photoCounter}`;
    } else {
      instructions.siteName = `${Constants.BRANDING_NAME} - ${photoCounter}`;
    }
  }
  
  if (photo.type === 'mosaic_photo' && !isOverrideMedia) {
    console.log('Mosaic object:', tweet.media?.mosaic);
    instructions.addHeaders = [
      `<meta property="twitter:image" content="${tweet.media?.mosaic?.formats.jpeg}"/>`,
      `<meta property="og:image" content="${tweet.media?.mosaic?.formats.jpeg}"/>`
    ];
  } else {
    instructions.addHeaders = [
      `<meta property="twitter:image" content="${photo.url}"/>`,
      `<meta property="og:image" content="${photo.url}"/>`,
      `<meta property="twitter:image:width" content="${photo.width}"/>`,
      `<meta property="twitter:image:height" content="${photo.height}"/>`,
      `<meta property="og:image:width" content="${photo.width}"/>`,
      `<meta property="og:image:height" content="${photo.height}"/>`
    ];
  }

  console.log('Photo render instructions', JSON.stringify(instructions));

  return instructions;
}