import { Constants } from '../constants';

export const fetchUsingGuest = async (
  screenName: string,
  status: string
): Promise<any> => {
  const activate = await fetch(`${Constants.TWITTER_ROOT}/1.1/guest/activate.json`, {
    method: 'POST',
    headers: {
      ...Constants.BASE_HEADERS,
      Authorization: `Bearer ${Constants.GUEST_BEARER_TOKEN}`,
    },
    body: '',
  });

  console.log(activate.json());

  return activate.json();
};
