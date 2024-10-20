import { Context } from 'hono';
import { handleStatus } from '../../../embed/status';
import { DataProvider } from '../../../enum';

export const bskyStatusRequest = async (c: Context) => {
  console.log('bluesky status request!!!');
  const { handle, id } = c.req.param();

  const userAgent = c.req.header('User-Agent') || '';
  const flags = {};
  // const language = null;

  return await handleStatus(
    c,
    id,
    handle,
    undefined, //mediaNumber ? parseInt(mediaNumber) : undefined,
    userAgent,
    flags,
    undefined,
    DataProvider.Bsky
  );
};
