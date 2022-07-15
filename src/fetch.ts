import { Constants } from './constants';

export const fetchUsingGuest = async (status: string): Promise<TimelineBlobPartial> => {
  const csrfToken = crypto.randomUUID().replace(/-/g, ''); // Generate a random CSRF token, this doesn't matter, Twitter just cares that header and cookie match

  let headers: { [header: string]: string } = {
    Authorization: Constants.GUEST_BEARER_TOKEN,
    ...Constants.BASE_HEADERS
  };

  /* If all goes according to plan, we have a guest token we can use to call API
     AFAIK there is no limit to how many guest tokens you can request.

     This can effectively mean virtually unlimited (read) access to Twitter's API,
     which is very funny. */
  const activate = await fetch(`${Constants.TWITTER_API_ROOT}/1.1/guest/activate.json`, {
    method: 'POST',
    headers: headers,
    body: ''
  });

  /* Let's grab that guest_token so we can use it */
  const activateJson = (await activate.json()) as { guest_token: string };
  const guestToken = activateJson.guest_token;

  /* Just some cookies to mimick what the Twitter Web App would send */
  headers['Cookie'] = [
    `guest_id_ads=v1%3A${guestToken}`,
    `guest_id_marketing=v1%3A${guestToken}`,
    `guest_id=v1%3A${guestToken}`,
    `ct0=${csrfToken};`
  ].join('; ');

  headers['x-csrf-token'] = csrfToken;
  headers['x-twitter-active-user'] = 'yes';
  headers['x-guest-token'] = guestToken;

  /* We pretend to be the Twitter Web App as closely as possible,
     so we use twitter.com/i/api/2 instead of api.twitter.com/2 */
  const conversation = (await (
    await fetch(
      `${Constants.TWITTER_ROOT}/i/api/2/timeline/conversation/${status}.json?${Constants.GUEST_FETCH_PARAMETERS}`,
      {
        method: 'GET',
        headers: headers
      }
    )
  ).json()) as TimelineBlobPartial;

  return conversation;
};
