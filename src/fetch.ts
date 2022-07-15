import { Constants } from './constants';

export const fetchUsingGuest = async (status: string): Promise<TimelineBlobPartial> => {
  const csrfToken = crypto.randomUUID().replace(/-/g, ''); // Generate a random CSRF token, this doesn't matter, Twitter just cares that header and cookie match

  let headers: { [header: string]: string } = {
    Authorization: Constants.GUEST_BEARER_TOKEN,
    ...Constants.BASE_HEADERS
  };

  let apiAttempts = 0;

  /* If all goes according to plan, we have a guest token we can use to call API
     AFAIK there is no limit to how many guest tokens you can request.

     This can effectively mean virtually unlimited (read) access to Twitter's API,
     which is very funny. */
  while (apiAttempts < 5) {
    apiAttempts++;

    const activate = await fetch(
      `${Constants.TWITTER_API_ROOT}/1.1/guest/activate.json`,
      {
        method: 'POST',
        headers: headers,
        body: ''
      }
    );

    /* Let's grab that guest_token so we can use it */
    let activateJson: { guest_token: string };

    try {
      activateJson = (await activate.json()) as { guest_token: string };
    } catch (e: any) {
      continue;
    }

    const guestToken = activateJson.guest_token;

    console.log('Activated guest:', activateJson);
    console.log('Guest token:', guestToken);

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

    if (
      typeof conversation.globalObjects === 'undefined' &&
      typeof conversation.errors === 'undefined'
    ) {
      console.log('Failed to fetch conversation, got', conversation);
      continue;
    }

    return conversation;
  }

  // @ts-ignore - This is only returned if we completely failed to fetch the conversation
  return {};
};
