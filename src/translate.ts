import { Constants } from './constants';
import { linkFixer } from './linkFixer';
import { Strings } from './strings';

export const translateTweet = async (
  tweet: TweetPartial,
  guestToken: string,
  language: string
): Promise<string> => {
  const csrfToken = crypto.randomUUID().replace(/-/g, ''); // Generate a random CSRF token, this doesn't matter, Twitter just cares that header and cookie match

  let headers: { [header: string]: string } = {
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
  let resultText = tweet.full_text;

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

    console.log(translationResults);

    if (
      translationResults.sourceLanguage === translationResults.destinationLanguage ||
      translationResults.translationState !== 'Success'
    ) {
      return tweet.full_text; // No work to do
    }

    console.log(`Twitter interpreted language as ${tweet.lang}`);

    let formatText =
      language === 'en'
        ? Strings.TRANSLATE_TEXT.format({
            language: translationResults.localizedSourceLanguage
          })
        : Strings.TRANSLATE_TEXT_INTL.format({
            source: translationResults.sourceLanguage.toUpperCase(),
            destination: translationResults.destinationLanguage.toUpperCase()
          });

    resultText =
      `${translationResults.translation}\n\n` +
      `${formatText}\n\n` +
      `${tweet.full_text}`;
  } catch (e: any) {
    console.error('Unknown error while fetching from Translation API');
    return tweet.full_text; // No work to do
  }

  return linkFixer(tweet, resultText);
};
