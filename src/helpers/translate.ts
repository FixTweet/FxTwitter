import { Constants } from '../constants';

/* Handles translating Tweets when asked! */
export const translateTweet = async (
  tweet: GraphQLTweet,
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
    'x-guest-token': guestToken,
    'Referer': `${Constants.TWITTER_ROOT}/i/status/${tweet.rest_id}`,
  };

  let translationApiResponse;
  let translationResults: TranslationPartial;

  /* Fix up some language codes that may be mistakenly used */
  switch(language) {
    case 'jp':
      language = 'ja';
      break;
    case 'kr':
      language = 'ko';
      break;
    case 'ua':
      language = 'uk';
      break;
    default:
      break;
  }

  headers['x-twitter-client-language'] = language;

  /* As of August 2023, you can no longer fetch translations with guest token */
  if (typeof TwitterProxy === 'undefined') {
    return null
  }

  try {
    const url = `${Constants.TWITTER_ROOT}/i/api/1.1/strato/column/None/tweetId=${tweet.rest_id},destinationLanguage=None,translationSource=Some(Google),feature=None,timeout=None,onlyCached=None/translation/service/translateTweet`;
    console.log(url, headers);
    translationApiResponse = await TwitterProxy.fetch(
      url,
      {
        method: 'GET',
        headers: headers
      }
    );
    translationResults = (await translationApiResponse.json()) as TranslationPartial;

    console.log(`translationResults`, translationResults);

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
