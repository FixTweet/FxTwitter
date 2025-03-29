/* This file contains types relevant to FixTweet and the FixTweet API
   For Twitter API types, see twitterTypes.d.ts */

import { Context } from 'hono';
import { DataProvider } from './enum';

declare type InputFlags = {
  standard?: boolean;
  direct?: boolean;
  api?: boolean;
  textOnly?: boolean;
  isXDomain?: boolean;
  forceInstantView?: boolean;
  instantViewUnrollThreads?: boolean;
  archive?: boolean;
  gallery?: boolean;
  nativeMultiImage?: boolean;
  name?: string;
  noActivity?: boolean;
};

declare interface StatusResponse {
  text?: string;
  response?: Response;
  cacheControl?: string | null;
}

declare interface ResponseInstructions {
  addHeaders: string[];
  authorText?: string;
  siteName?: string;
  engagementText?: string;
  text?: string;
}

declare interface RenderProperties {
  context: Context;
  status: APIStatus;
  thread?: SocialThread;
  siteText?: string;
  authorText?: string;
  engagementText?: string;
  isOverrideMedia?: boolean;
  userAgent?: string;
  text?: string;
  flags?: InputFlags;
  targetLanguage?: string;
}

declare interface TweetAPIResponse {
  code: number;
  message: string;
  tweet?: APITwitterStatus;
}

declare interface StatusAPIResponse {
  code: number;
  message: string;
  status?: APITwitterStatus;
}

declare interface UserAPIResponse {
  code: number;
  message: string;
  user?: APIUser;
}

declare interface APITranslate {
  text: string;
  source_lang: string;
  source_lang_en: string;
  target_lang: string;
}

declare interface APIExternalMedia {
  type: 'video';
  url: string;
  thumbnail_url?: string;
  height?: number;
  width?: number;
}

declare interface APIPollChoice {
  label: string;
  count: number;
  percentage: number;
}

declare interface APIPoll {
  choices: APIPollChoice[];
  total_votes: number;
  ends_at: string;
  time_left_en: string;
}

declare interface APIMedia {
  type: string;
  url: string;
  width: number;
  height: number;
}

declare interface APIPhoto extends APIMedia {
  type: 'photo';
  altText: string;
}

declare interface APIVideo extends APIMedia {
  type: 'video' | 'gif';
  thumbnail_url: string;
  format: string;
  duration: number;
  variants: TweetMediaFormat[];
}

declare interface APIMosaicPhoto extends APIMedia {
  type: 'mosaic_photo';
  formats: {
    webp: string;
    jpeg: string;
  };
}

declare interface APIStatus {
  id: string;
  url: string;
  text: string;
  created_at: string;
  created_timestamp: number;

  likes: number;
  reposts: number;
  replies: number;

  quote?: APIStatus;
  poll?: APIPoll;
  author: APIUser;

  media: {
    external?: APIExternalMedia;
    photos?: APIPhoto[];
    videos?: APIVideo[];
    all?: APIMedia[];
    mosaic?: APIMosaicPhoto;
  };

  raw_text: {
    text: string;
    facets: APIFacet[];
  };

  lang: string | null;
  possibly_sensitive: boolean;

  replying_to: {
    screen_name: string;
    post: string;
  } | null;

  source: string | null;

  embed_card: 'tweet' | 'summary' | 'summary_large_image' | 'player';
  provider: DataProvider;
}

declare interface APIFacet {
  type: string;
  indices: [start: number, end: number];
  original?: string;
  replacement?: string;
  display?: string;
  id?: string;
}

declare interface APITwitterCommunityNote {
  text: string;
  entities: BirdwatchEntity[];
}

declare interface APITwitterStatus extends APIStatus {
  views?: number | null;
  translation?: APITranslate;

  is_note_tweet: boolean;
  community_note: APITwitterCommunityNote | null;
  provider: DataProvider.Twitter;
}

declare interface APIBlueskyStatus extends APIStatus {
  provider: DataProvider.Bsky;
}

declare interface APIUser {
  id: string;
  name: string;
  screen_name: string;
  avatar_url: string;
  banner_url: string;
  // verified: 'legacy' | 'blue'| 'business' | 'government';
  // verified_label: string;
  description: string;
  location: string;
  url: string;
  protected: boolean;
  followers: number;
  following: number;
  statuses: number;
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

declare interface SocialPost {
  status: APIStatus | APITwitterStatus | null;
  author: APIUser | null;
}

declare interface SocialThread {
  status: APIStatus | APITwitterStatus | null;
  thread: (APIStatus | APITwitterStatus)[] | null;
  author: APIUser | null;
  code: number;
}

declare interface FetchResults {
  status: number;
}

declare interface OEmbed {
  author_name?: string;
  author_url?: string;
  provider_name?: string;
  provider_url?: string;
  title?: string | null;
  type: 'link' | 'rich';
  version: '1.0';
}



// Mastodon API V1 Interfaces
export interface ActivityStatus {
  id: string;
  url: string;
  uri: string;
  created_at: string;
  edited_at: string | null;
  reblog: null;
  in_reply_to_id: string | undefined | null;
  in_reply_to_account_id: string | undefined | null;
  language: string | undefined | null;
  content: string;
  spoiler_text: string;
  visibility: 'public';
  application: {
    name: string | null;
    website: string | null;
  };
  media_attachments: ActivityMediaAttachment[];
  account: ActivityAccount;
  mentions: [];
  tags: [];
  emojis: [];
  card: null;
  poll: null;
}

export interface ActivityAccount {
  id: string;
  display_name: string;
  username: string;
  acct: string;
  url: string;
  uri: string;
  created_at: string;
  locked: boolean;
  bot: boolean;
  discoverable: boolean;
  indexable: boolean;
  group: boolean;
  avatar: string | undefined;
  avatar_static: string | undefined;
  header: string | undefined;
  header_static: string | undefined;
  followers_count: number | undefined;
  following_count: number | undefined;
  statuses_count: number | undefined;
  hide_collections: boolean;
  noindex: boolean;
  emojis: [];
  roles: [];
  fields: [];
}

export interface ActivityMediaAttachment {
  id: string;
  type: 'image' | 'video' | 'gifv' | 'audio' | string;
  url: string;
  preview_url: string;
  remote_url: string | null;
  preview_remote_url: string | null;
  text_url: string | null;
  description: string | null;
  meta: {
    original?: {
      width: number;
      height: number;
      size?: string;
      aspect?: number;
    };
    small?: {
      width: number;
      height: number;
      size?: string;
      aspect?: number;
    };
  };
}