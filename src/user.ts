import { Constants } from './constants';
import { Strings } from './strings';
import { userAPI } from './api/user';

export const returnError = (error: string): StatusResponse => {
  return {
    text: Strings.BASE_HTML.format({
      lang: '',
      headers: [
        `<meta property="og:title" content="${Constants.BRANDING_NAME}"/>`,
        `<meta property="og:description" content="${error}"/>`
      ].join('')
    })
  };
};

/* Handler for Twitter users */
export const handleProfile = async (
  username: string,
  userAgent?: string,
  flags?: InputFlags,
  language?: string,
  event?: FetchEvent
): Promise<StatusResponse> => {
  console.log('Direct?', flags?.direct);

  const api = await userAPI(username, language, event as FetchEvent);
  const user = api?.user as APIUser;

  /* Catch this request if it's an API response */
  // For now we just always return the API response while testing
  if (flags?.api) {
    return {
      response: new Response(JSON.stringify(api), {
        headers: { ...Constants.RESPONSE_HEADERS, ...Constants.API_RESPONSE_HEADERS },
        status: api.code
      })
    };
  }

  /* If there was any errors fetching the User, we'll return it */
  switch (api.code) {
    case 401:
      return returnError(Strings.ERROR_PRIVATE);
    case 404:
      return returnError(Strings.ERROR_USER_NOT_FOUND);
    case 500:
      return returnError(Strings.ERROR_API_FAIL);
  }

  /* Base headers included in all responses */
  const headers = [
    `<meta property="twitter:site" content="@${user.screen_name}"/>`,
  ];

  // TODO Add card creation logic here

  /* Finally, after all that work we return the response HTML! */
  return {
    text: Strings.BASE_HTML.format({
      lang: `lang="en"`,
      headers: headers.join('')
    }),
    cacheControl: null
  };
};
