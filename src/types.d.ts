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

interface APIPhoto {
  type: 'photo';
  url: string;
  width: number;
  height: number;
}

interface APIMosaicPhoto {
  type: 'mosaic_photo';
  width: number;
  height: number;
  formats: {
    webp: string;
    jpeg: string;
  };
}

interface APIVideo {
  type: 'video' | 'gif';
  url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  format: string;
}

interface APITweet {
  id: string;
  url: string;
  tweet: string;
  text: string;
  created_at: string;

  likes: number;
  retweets: number;
  replies: number;

  color: string;

  quote?: APITweet;
  poll?: APIPoll;
  translation?: APITranslate;
  author: APIAuthor;

  media?: {
    external?: APIExternalMedia;
    photos?: APIPhoto[];
    video?: APIVideo;
    mosaic?: APIMosaicPhoto;
  };

  lang: string | null;
  replying_to: string | null;

  twitter_card: 'tweet' | 'summary' | 'summary_large_image' | 'player';
}
