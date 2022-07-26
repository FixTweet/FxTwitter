import { Constants } from './constants';

export const translateTweet = async (
  tweet: TweetPartial,
  guestToken: string,
  language: string
): Promise<TranslationPartial | null> => {
  const csrfToken = crypto.randomUUID().replace(/-/g, ''); // Generate a random CSRF token, this doesn't matter, Twitter just cares that header and cookie match

  const headers: { [header: string]: string } = {
    'Authorization': Constants.GUEST_BEARER_TOKEN,
    ...Constants.BASE_HEADERS,
    'Cookie': [
      `guest_id_ads=v1%3A${guestToken}`,
      `guest_id_marketing=v1%3A${guestToken}`,
      `guest_id=v1%3A${guestToken}`,
      `ct0=${csrfToken};`
    ].join('; '),
    'x-csrf-token': csrfToken,
    'x-twitter-active-user': 'yes',
    'x-guest-token': guestToken
  };

  let apiRequest;
  let translationResults: TranslationPartial;

  headers['x-twitter-client-language'] = language;

  try {
    apiRequest = await fetch(
      `${Constants.TWITTER_ROOT}/i/api/1.1/strato/column/None/tweetId=${tweet.id_str},destinationLanguage=None,translationSource=Some(Google),feature=None,timeout=None,onlyCached=None/translation/service/translateTweet`,
      {
        method: 'GET',
        headers: headers
      }
    );
    translationResults = (await apiRequest.json()) as TranslationPartial;

    if (translationResults.translationState !== 'Success') {
      return null;
    }

    console.log(translationResults);
    return translationResults;
  } catch (e: unknown) {
    console.error('Unknown error while fetching from Translation API', e);
    return {} as TranslationPartial; // No work to do
  }
};
