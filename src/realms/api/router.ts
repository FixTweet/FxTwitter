import { Hono } from 'hono';
import { statusRequest } from '../twitter/routes/status';
import { profileRequest } from '../twitter/routes/profile';
import { Strings } from '../../strings';

export const api = new Hono();

/* Current v1 API endpoints. Currently, these still go through the Twitter embed requests. API v2+ won't do this. */
api.get('/:handle?/status/:id/:language?', statusRequest);
api.get(
  '/:handle?/status/:id/:mediaType{(photos?|videos?)}/:mediaNumber{[1-4]}/:language?',
  statusRequest
);

api.get('/:handle', profileRequest);

api.get(
  '/robots.txt',
  async (c) => {
    c.header('cache-control', 'max-age=0, no-cache, no-store, must-revalidate');
    c.status(200);
    return c.text(Strings.ROBOTS_TXT);
  }
);
