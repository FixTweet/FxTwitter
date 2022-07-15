/*
  Types for various objects.
  Note that a lot of these are not actually complete types. Many unused values may be missing.
*/

type TimelineBlobPartial = {
  globalObjects: {
    tweets: {
      [tweetId: string]: TweetPartial;
    };
    users: {
      [userId: string]: UserPartial;
    };
  };
};

type TweetMediaSize = {
  w: number;
  h: number;
  resize: 'crop' | 'fit';
};

type TweetMediaFormat = {
  bitrate: number;
  content_type: string;
  url: string;
};

type TcoExpansion = {
  display_url: string;
  expanded_url: string;
  indices: [number, number];
  url: string;
};

type TweetMedia = {
  additional_media_info: { monetizable: boolean };
  display_url: string;
  expanded_url: string;
  ext_media_color?: {
    palette?: MediaPlaceholderColor[];
  };
  id_str: string;
  indices: [number, number];
  media_key: string;
  media_url: string;
  media_url_https: string;
  original_info: { width: number; height: number };
  sizes: {
    thumb: TweetMediaSize;
    large: TweetMediaSize;
    medium: TweetMediaSize;
    small: TweetMediaSize;
  };
  type: 'photo' | 'video';
  url: string;
  video_info?: {
    aspect_ratio: [number, number];
    duration_millis: number;
    variants: TweetMediaFormat[];
  };
};

type CardValue = {
  type: 'BOOLEAN' | 'STRING';
  boolean_value: boolean;
  string_value: string;
};

type TweetCard = {
  binding_values: {
    card_url: CardValue;
    choice1_count?: CardValue;
    choice2_count?: CardValue;
    choice3_count?: CardValue;
    choice4_count?: CardValue;
    choice1_label?: CardValue;
    choice2_label?: CardValue;
    choice3_label?: CardValue;
    choice4_label?: CardValue;
    counts_are_final?: CardValue;
    duration_minutes?: CardValue;
    end_datetime_utc?: CardValue;

    player_url?: CardValue;
    player_width?: CardValue;
    player_height?: CardValue;
    title?: CardValue;
  };
  name: string;
};

type TweetPartial = {
  card?: TweetCard;
  conversation_id_str: string;
  created_at: string; // date string
  display_text_range: [number, number];
  entities: { urls?: TcoExpansion[]; media?: TweetMedia[] };
  extended_entities: { media?: TweetMedia[] };
  favorite_count: number;
  in_reply_to_screen_name?: string;
  in_reply_to_status_id_str?: string;
  in_reply_to_user_id_str?: string;
  id_str: string;
  lang: string;
  possibly_sensitive_editable: boolean;
  retweet_count: number;
  quote_count: number;
  quoted_status_id_str: string;
  reply_count: number;
  source: string;
  full_text: string;
  user_id_str: string;
  user?: UserPartial;
};

type UserPartial = {
  id_str: string;
  name: string;
  screen_name: string;
  profile_image_url_https: string;
  profile_image_extensions_media_color?: {
    palette?: MediaPlaceholderColor[];
  };
};

type MediaPlaceholderColor = {
  rgb: {
    red: number;
    green: number;
    blue: number;
  };
};
