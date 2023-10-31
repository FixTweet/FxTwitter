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

interface TweetAPIResponse {
  code: number;
  message: string;
  tweet?: APITweet;
}

interface SocialPostAPIResponse {
  code: number;
  message: string;
  post?: APITweet;
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

interface APIPost {
  id: string;
  url: string;
  text: string;
  created_at: string;
  created_timestamp: number;

  likes: number;
  reposts: number;
  replies: number;

  quote?: APIPost;
  poll?: APIPoll;
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

  reply_of: {
    screen_name: string | null;
    post: string | null;
  } | null

  source: string | null;

  embed_card: 'tweet' | 'summary' | 'summary_large_image' | 'player';
}

interface APITweet extends APIPost {
  views?: number | null;
  translation?: APITranslate;

  is_note_tweet: boolean;
}

interface APIUser {
  id: string;
  name: string;
  screen_name: string;
  global_screen_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  // verified: 'legacy' | 'blue'| 'business' | 'government';
  // verified_label: string;
  description: string | null;
  location: string | null;
  url: string;
  protected: boolean;
  followers: number;
  following: number;
  tweets?: number;
  posts?: number;
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

interface SocialPost {
  post: APIPost | APITweet | null;
  author: APIUser | null;
}

interface SocialThread {
  post: APIPost | APITweet | null;
  thread: (APIPost | APITweet)[] | null;
  author: APIUser | null;
  code: number;
}