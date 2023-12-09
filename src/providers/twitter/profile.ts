import { Context } from 'hono';
import { Constants } from '../../constants';
import { fetchUser } from './fetch';
import { linkFixer } from '../../helpers/linkFixer';

export const convertToApiUser = (user: GraphQLUser, legacyAPI = false): APIUser => {
  const apiUser = {} as APIUser;
  /* Populating a lot of the basics */
  apiUser.url = `${Constants.TWITTER_ROOT}/${user.legacy.screen_name}`;
  apiUser.id = user.rest_id;
  apiUser.followers = user.legacy.followers_count;
  apiUser.following = user.legacy.friends_count;
  apiUser.likes = user.legacy.favourites_count;
  if (legacyAPI) {
    // @ts-expect-error Use tweets for legacy API
    apiUser.tweets = user.legacy.statuses_count;
  } else {
    apiUser.statuses = user.legacy.statuses_count;
  }
  apiUser.name = user.legacy.name;
  apiUser.screen_name = user.legacy.screen_name;
  apiUser.global_screen_name = `${user.legacy.screen_name}@${Constants.TWITTER_GLOBAL_NAME_ROOT}`;
  apiUser.description = user.legacy.description
    ? linkFixer(user.legacy.entities?.description?.urls, user.legacy.description)
    : '';
  apiUser.location = user.legacy.location ? user.legacy.location : '';
  apiUser.banner_url = user.legacy.profile_banner_url ? user.legacy.profile_banner_url : '';
  /*
  if (user.is_blue_verified) {
    apiUser.verified = 'blue';
  } else if (user.legacy.verified) {
    if (user.legacy.verified_type === 'Business') {
      apiUser.verified = 'business';
    } else if (user.legacy.verified_type === 'Government') {
      apiUser.verified = 'government';
    } else {
      apiUser.verified = 'legacy';
    }
  }
  
  if (apiUser.verified === 'government') {
    apiUser.verified_label = user.affiliates_highlighted_label?.label?.description || '';
  }
  */
  apiUser.avatar_url = user.legacy.profile_image_url_https;
  apiUser.joined = user.legacy.created_at;
  if (user.legacy_extended_profile?.birthdate) {
    const { birthdate } = user.legacy_extended_profile;
    apiUser.birthday = {};
    if (typeof birthdate.day === 'number') apiUser.birthday.day = birthdate.day;
    if (typeof birthdate.month === 'number') apiUser.birthday.month = birthdate.month;
    if (typeof birthdate.year === 'number') apiUser.birthday.year = birthdate.year;
  }
  const website = user.legacy.entities?.url?.urls?.[0];

  if (website) {
    apiUser.website = {
      url: website.expanded_url,
      display_url: website.display_url
    };
  } else {
    apiUser.website = null;
  }

  return apiUser;
};

/* This function does the heavy lifting of processing data from Twitter API
   and using it to create FixTweet's streamlined API responses */
const populateUserProperties = async (
  response: GraphQLUserResponse,
  legacyAPI = false
): Promise<APIUser | null> => {
  const user = response?.data?.user?.result;
  if (user) {
    return convertToApiUser(user, legacyAPI);
  }

  return null;
};

/* API for Twitter profiles (Users)
   Used internally by FixTweet's embed service, or
   available for free using api.fxtwitter.com. */
export const userAPI = async (
  username: string,
  c: Context
  // flags?: InputFlags
): Promise<UserAPIResponse> => {
  const userResponse = await fetchUser(username, c);
  if (!userResponse || !Object.keys(userResponse).length) {
    return {
      code: 404,
      message: 'User not found'
    };
  }
  /* Creating the response objects */
  const response: UserAPIResponse = { code: 200, message: 'OK' } as UserAPIResponse;
  const apiUser: APIUser = (await populateUserProperties(userResponse, true)) as APIUser;

  /* Currently, we haven't rolled this out as it's part of the proto-v2 API */
  delete apiUser?.global_screen_name;

  /* Finally, staple the User to the response and return it */
  response.user = apiUser;

  return response;
};
