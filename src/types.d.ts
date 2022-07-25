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
  translated_text: string;
  source_language: string;
  target_language: string;
}

interface APIAuthor {
  name?: string;
  screen_name?: string;
  profile_picture_url?: string;
  profile_banner_url?: string;
}

interface APIPoll {
  
}

interface APITweet {
  id: string;
  tweet: string;
  text?: string;
  created_at: string;

  likes: number;
  retweets: number;
  replies: number;

  quote_tweet?: APITweet;
  translation?: APITranslate;
  author: APIAuthor;

  thumbnail: string;

}