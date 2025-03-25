import { Context } from 'hono';
import { DataProvider } from '../../../embed/status';
import { Strings } from '../../../strings';
import { handleActivity } from '../../../embed/activity';

/* Handler for activity request */
export const activityRequest = async (c: Context) => {
  const { snowcode } = c.req.param();

  /* This throws the necessary data to handleStatus (in status.ts) */
  const statusResponse = await handleActivity(c, snowcode ?? '0', DataProvider.Bsky);

  if (statusResponse) {
    c.status(200);
    /* Return the response containing embed information */
    return statusResponse;
  } else {
    /* Somehow handleStatus sent us nothing. This should *never* happen, but we have a case for it. */
    return c.text(Strings.ERROR_UNKNOWN, 500);
  }
};
