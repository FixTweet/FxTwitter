/* tweetTypes has all the Twitter API-related types */

type InputFlags = {
  standard?: boolean;
  direct?: boolean;
  api?: boolean;
};

interface StatusResponse {
  text?: string;
  response?: Response;
}

interface Request {
  params: {
    [param: string]: string;
  };
}

interface APIResponse {
  code: number;
  message: string;
  tweet?: APITweet;
}

interface APITranslate {
  text: string;
  source_lang: string;
  target_lang: string;
}

interface APIAuthor {
  name?: string;
  screen_name?: string;
  avatar_url?: string;
  avatar_color: string;
  banner_url?: string;
}

interface APIExternalMedia {
  type: 'video';
  url: string;
  height: number;
  width: number;
}

interface APIPollChoice {
  label: string;
  count: number;
  percentage: number;
}

interface APIPoll {
  choices: APIPollChoice[];
  total_votes: number;
  ends_at: string;
}

interface APITweet {
  id: string;
  tweet: string;
  text?: string;
  created_at: string;

  likes: number;
  retweets: number;
  replies: number;

  palette: string;

  quote?: APITweet;
  poll?: APIPoll;
  translation?: APITranslate;
  author: APIAuthor;

  media: {
    external?: APIExternalMedia;
  };
}
