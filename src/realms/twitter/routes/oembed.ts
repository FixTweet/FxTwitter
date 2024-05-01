import { Context } from 'hono';
import motd from '../../../../motd.json';
import { Constants } from '../../../constants';
import { Strings } from '../../../strings';

export const oembed = async (c: Context) => {
  console.log('oembed hit!');
  const { searchParams } = new URL(c.req.url);

  /* Fallbacks */
  const text = searchParams.get('text') ?? 'Twitter';
  const author = searchParams.get('author') ?? 'jack';
  const status = searchParams.get('status') ?? '20';

  const random = Math.floor(Math.random() * Object.keys(motd).length);
  const [name, url] = Object.entries(motd)[random];

  const statusUrl = `${Constants.TWITTER_ROOT}/${encodeURIComponent(author)}/status/${status}`;

  const data: OEmbed = {
    author_name: text,
    author_url: statusUrl,
    provider_name: searchParams.get('provider') ?? name,
    provider_url: searchParams.get('provider') ? statusUrl : url,
    title: Strings.DEFAULT_AUTHOR_TEXT,
    type: 'link',
    version: '1.0'
  };

  c.header('content-type', 'application/json');
  /* Stringify and send it on its way! */
  return c.text(JSON.stringify(data), 200);
};
