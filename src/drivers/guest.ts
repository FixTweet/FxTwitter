import { Constants } from '../constants';

export const fetchUsingGuest = async (status: string): Promise<TweetPartial> => {
  const csrfToken = crypto.randomUUID().replace(/-/g, ''); // Generate a random CSRF token, this doesn't matter, Twitter just cares that header and cookie match

  let headers: { [header: string]: string } = {
    Authorization: Constants.GUEST_BEARER_TOKEN,
    ...Constants.BASE_HEADERS,
  };

  const activate = await fetch(`${Constants.TWITTER_API_ROOT}/1.1/guest/activate.json`, {
    method: 'POST',
    headers: headers,
    body: '',
  });

  const activateJson = (await activate.json()) as { guest_token: string };
  const guestToken = activateJson.guest_token;

  headers['Cookie'] = `guest_id=v1%3A${guestToken}; ct0=${csrfToken};`;
  headers['x-csrf-token'] = csrfToken;
  headers['x-twitter-active-user'] = 'yes';
  headers['x-guest-token'] = guestToken;

  const conversation = (await (
    await fetch(
      `${Constants.TWITTER_ROOT}/i/api/2/timeline/conversation/${status}.json?${Constants.GUEST_FETCH_PARAMETERS}`,
      {
        method: 'GET',
        headers: headers,
      }
    )
  ).json()) as TimelineBlobPartial;

  console.log(conversation);

  const tweet = conversation?.globalObjects?.tweets?.[status] || {};

  tweet.user = conversation?.globalObjects?.users?.[tweet.user_id_str] || {};

  return tweet;
};
