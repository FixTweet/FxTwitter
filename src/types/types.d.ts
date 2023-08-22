/* This file contains types relevant to FixTweet and the FixTweet API
   For Twitter API types, see twitterTypes.d.ts */

type InputFlags = {
  standard?: boolean;
  direct?: boolean;
  api?: boolean;
  deprecated?: boolean;
  textOnly?: boolean;
  isXDomain?: boolean;
  forceInstantView?: boolean;
  archive?: boolean;
};

interface StatusResponse {
  text?: string;
  response?: Response;
  cacheControl?: string | null;
}

interface ResponseInstructions {
  addHeaders: string[];
  authorText?: string;
  siteName?: string;
  engagementText?: string;
  text?: string;
}

interface RenderProperties {
  tweet: APITweet;
  siteText?: string;
  authorText?: string;
  engagementText?: string;
  isOverrideMedia?: boolean;
  userAgent?: string;
  text?: string;
  flags?: InputFlags;
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

interface TweetAPIResponse {
  code: number;
  message: string;
  tweet?: APITweet;
}

interface UserAPIResponse {
  code: number;
  message: string;
  user?: APIUser;
}

interface APITranslate {
  text: string;
  source_lang: string;
  source_lang_en: string;
  target_lang: string;
}

interface BaseUser {
  id?: string;
  name?: string;
  screen_name?: string;
  avatar_url?: string;
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

interface APIMedia {
  type: string;
  url: string;
  width: number;
  height: number;
}

interface APIPhoto extends APIMedia {
  type: 'photo';
  altText: string;
}

interface APIVideo extends APIMedia {
  type: 'video' | 'gif';
  thumbnail_url: string;
  format: string;
  duration: number;
}

interface APIMosaicPhoto extends APIMedia {
  type: 'mosaic_photo';
  formats: {
    webp: string;
    jpeg: string;
  };
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
  views?: number | null;

  color: string | null;

  quote?: APITweet;
  poll?: APIPoll;
  translation?: APITranslate;
  author: APIUser;

  media?: {
    external?: APIExternalMedia;
    photos?: APIPhoto[];
    videos?: APIVideo[];
    all?: APIMedia[];
    mosaic?: APIMosaicPhoto;
  };

  lang: string | null;
  possibly_sensitive: boolean;

  replying_to: string | null;
  replying_to_status: string | null;

  source: string;

  is_note_tweet: boolean;

  twitter_card: 'tweet' | 'summary' | 'summary_large_image' | 'player';
}

interface APIUser extends BaseUser {
  // verified: 'legacy' | 'blue'| 'business' | 'government';
  // verified_label: string;
  description: string;
  location: string;
  url: string;
  avatar_color?: string | null;
  protected: boolean;
  followers: number;
  following: number;
  tweets: number;
  likes: number;
  joined: string;
  website: {
    url: string;
    display_url: string;
  } | null;
  birthday: {
    day?: number;
    month?: number;
    year?: number;
  };
}
