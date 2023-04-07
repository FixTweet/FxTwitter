/* This file contains types relevant to FixTweet and the FixTweet API
   For Twitter API types, see twitterTypes.d.ts */

type InputFlags = {
  standard?: boolean;
  direct?: boolean;
  api?: boolean;
  deprecated?: boolean;
  textOnly?: boolean;
};

interface StatusResponse {
  text?: string;
  response?: Response;
  cacheControl?: string | null;
}

interface Request {
  params: {
    [param: string]: string;
  };
}

interface Size {
  width: number;
  height: number;
}

interface HorizontalSize {
  width: number;
  height: number;
  firstWidth: number;
  secondWidth: number;
}

interface VerticalSize {
  width: number;
  height: number;
  firstHeight: number;
  secondHeight: number;
}

interface APIResponse {
  code: number;
  message: string;
  tweet?: APITweet;
}

interface APITranslate {
  text: string;
  source_lang: string;
  source_lang_en: string;
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
  time_left_en: string;
}

interface APIPhoto {
  type: 'photo';
  url: string;
  width: number;
  height: number;
}

interface APIMosaicPhoto {
  type: 'mosaic_photo';
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
  duration: number;
}

interface APITweet {
  id: string;
  url: string;
  text: string;
  created_at: string;
  created_timestamp: number;

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
    videos?: APIVideo[];
    mosaic?: APIMosaicPhoto;
  };

  lang: string | null;
  replying_to: string | null;

  source: string;

  twitter_card: 'tweet' | 'summary' | 'summary_large_image' | 'player';
}
