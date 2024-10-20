import { Context } from 'hono';
import { Constants } from '../../../constants';
import { Strings } from '../../../strings';

export const oembed = async (c: Context) => {
  console.log('oembed hit!');
  const { searchParams } = new URL(c.req.url);

  /* Fallbacks */
  const text = searchParams.get('text') ?? '';
  const author = searchParams.get('author') ?? '';
  const status = searchParams.get('status') ?? '';

  const statusUrl = `${Constants.BSKY_ROOT}/profile/${encodeURIComponent(author)}/post/${status}`;

  const data: OEmbed = {
    author_name: text,
    author_url: statusUrl,
    provider_name: searchParams.get('provider') ?? Constants.BRANDING_NAME_BSKY,
    provider_url: searchParams.get('provider') ? statusUrl : Constants.REDIRECT_URL_BSKY,
    title: Strings.DEFAULT_AUTHOR_TEXT,
    type: 'link',
    version: '1.0'
  };

  c.header('content-type', 'application/json');
  /* Stringify and send it on its way! */
  return c.text(JSON.stringify(data), 200);
};
