import { Hono } from 'hono';
import { statusRequest } from '../twitter/routes/status';
import { profileRequest } from '../twitter/routes/profile';
import { Strings } from '../../strings';
import { Constants } from '../../constants';

export const api = new Hono();

/* Current v1 API endpoints. Currently, these still go through the Twitter embed requests. API v2+ won't do this. */
api.get('/status/:id/:language?', statusRequest);
api.get('/:handle/status/:id/:language?', statusRequest);
api.get('/robots.txt', async c => c.text(Strings.ROBOTS_TXT_API));

api.get('/:handle', profileRequest);

api.all('*', async c => c.redirect(Constants.API_DOCS_URL, 302));