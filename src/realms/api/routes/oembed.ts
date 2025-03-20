import { Context } from 'hono';
import { Constants } from '../../../constants';
import { Strings } from '../../../strings';
import { OEmbed } from '../../../types/types';
import { getBranding } from '../../../helpers/branding';

export const oembed = async (c: Context) => {
  console.log('oembed hit!');
  const { searchParams } = new URL(c.req.url);

  /* Fallbacks */
  const text = searchParams.get('text') ?? 'Twitter';
  const author = searchParams.get('author') ?? 'jack';
  const status = searchParams.get('status') ?? '20';

  const statusUrl = `${Constants.TWITTER_ROOT}/${encodeURIComponent(author)}/status/${status}`;
  const branding = getBranding(c);

  const data: OEmbed = {
    author_name: text,
    author_url: statusUrl,
    provider_name: searchParams.get('provider') ?? branding.name,
    provider_url: searchParams.get('provider') ? statusUrl : branding.redirect,
    title: Strings.DEFAULT_AUTHOR_TEXT,
    type: 'rich',
    version: '1.0'
  };

  c.header('content-type', 'application/json');
  /* Stringify and send it on its way! */
  return c.text(JSON.stringify(data), 200);
};
