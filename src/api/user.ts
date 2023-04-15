import { renderCard } from '../helpers/card';
import { Constants } from '../constants';
import { fetchConversation, fetchUser } from '../fetch';
import { linkFixer } from '../helpers/linkFixer';
import { handleMosaic } from '../helpers/mosaic';
import { colorFromPalette } from '../helpers/palette';
import { translateTweet } from '../helpers/translate';
import { unescapeText } from '../helpers/utils';
import { processMedia } from '../helpers/media';

/* This function does the heavy lifting of processing data from Twitter API
   and using it to create FixTweet's streamlined API responses */
const populateUserProperties = async (
  response: GraphQLUserResponse,
  language: string | undefined
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<APIUser> => {
  const apiUser = {} as APIUser;

  const user = response.data.user.result;
  /* Populating a lot of the basics */
  apiUser.url = `${Constants.TWITTER_ROOT}/${user.legacy.screen_name}`;
  apiUser.id = user.id;
  apiUser.followers = user.legacy.followers_count;
  apiUser.following = user.legacy.friends_count;
  apiUser.likes = user.legacy.favourites_count;
  apiUser.tweets = user.legacy.statuses_count;
  apiUser.name = user.legacy.name;
  apiUser.screen_name = user.legacy.screen_name;
  apiUser.description = user.legacy.description;
  apiUser.location = user.legacy.location;
  apiUser.verified = user.legacy.verified;
  apiUser.avatar_url = user.legacy.profile_image_url_https;

  return apiUser;
};

const writeDataPoint = (
  event: FetchEvent,
  language: string | undefined,
  returnCode: string,
  flags?: InputFlags
) => {
  console.log('Writing data point...');
  if (typeof AnalyticsEngine !== 'undefined') {
    const flagString =
      Object.keys(flags || {})
        // @ts-expect-error - TypeScript doesn't like iterating over the keys, but that's OK
        .filter(flag => flags?.[flag])[0] || 'standard';

    AnalyticsEngine.writeDataPoint({
      blobs: [
        event.request.cf?.colo as string /* Datacenter location */,
        event.request.cf?.country as string /* Country code */,
        event.request.headers.get('user-agent') ??
          '' /* User agent (for aggregating bots calling) */,
        returnCode /* Return code */,
        flagString /* Type of request */,
        language ?? '' /* For translate feature */
      ],
      doubles: [0 /* NSFW media = 1, No NSFW Media = 0 */],
      indexes: [event.request.headers.get('cf-ray') ?? '' /* CF Ray */]
    });
  }
};

/* API for Twitter profiles (Users)
   Used internally by FixTweet's embed service, or
   available for free using api.fxtwitter.com. */
export const userAPI = async (
  username: string,
  language: string | undefined,
  event: FetchEvent,
  flags?: InputFlags
): Promise<UserAPIResponse> => {
  const userResponse = await fetchUser(username, event);

  /* Creating the response objects */
  const response: UserAPIResponse = { code: 200, message: 'OK' } as UserAPIResponse;
  const apiTweet: APIUser = (await populateUserProperties(
    userResponse,
    language
  )) as APIUser;

  /* Finally, staple the User to the response and return it */
  response.user = apiTweet;

  writeDataPoint(event, language, 'OK', flags);

  return response;
};
