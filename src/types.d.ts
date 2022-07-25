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

interface APITweet {
  id: string;
  tweet: string;
  text?: string;
  created_at: string;

  likes: number;
  retweets: number;
  replies: number;

  name?: string;
  screen_name?: string;
  profile_picture_url?: string;
  profile_banner_url?: string;

  quote_tweet?: APITweet;

  thumbnail: string;

}