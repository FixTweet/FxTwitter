import { Constants } from '../constants';
import { fetchUser } from '../fetch';

/* This function does the heavy lifting of processing data from Twitter API
   and using it to create FixTweet's streamlined API responses */
const populateUserProperties = async (
  response: GraphQLUserResponse
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<APIUser> => {
  const apiUser = {} as APIUser;

  const user = response.data.user.result;
  /* Populating a lot of the basics */
  apiUser.url = `${Constants.TWITTER_ROOT}/${user.legacy.screen_name}`;
  apiUser.id = user.rest_id;
  apiUser.followers = user.legacy.followers_count;
  apiUser.following = user.legacy.friends_count;
  apiUser.likes = user.legacy.favourites_count;
  apiUser.tweets = user.legacy.statuses_count;
  apiUser.name = user.legacy.name;
  apiUser.screen_name = user.legacy.screen_name;
  apiUser.description = user.legacy.description;
  apiUser.location = user.legacy.location;
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

  return apiUser;
};

/* API for Twitter profiles (Users)
   Used internally by FixTweet's embed service, or
   available for free using api.fxtwitter.com. */
export const userAPI = async (
  username: string,
  event: FetchEvent,
  flags?: InputFlags
): Promise<UserAPIResponse> => {
  const userResponse = await fetchUser(username, event);

  /* Creating the response objects */
  const response: UserAPIResponse = { code: 200, message: 'OK' } as UserAPIResponse;
  const apiUser: APIUser = (await populateUserProperties(userResponse)) as APIUser;

  /* Finally, staple the User to the response and return it */
  response.user = apiUser;

  return response;
};
