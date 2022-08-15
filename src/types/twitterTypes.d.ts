/* Types for various Twitter API objects.
   Note that a lot of these are not actually complete types. Many unused values may be missing.*/

type TimelineContent = {
  item?: {
    content?: {
      tombstone?: {
        timestoneInfo: {
          richText: {
            text: string;
          };
        };
      };
    };
  };
};

type TimelineInstruction = {
  addEntries?: {
    entries: {
      content: TimelineContent;
      entryId: string;
    }[];
  };
};

type TwitterAPIError = {
  code: number;
  message: string;
};

type TimelineBlobPartial = {
  globalObjects: {
    tweets: {
      [tweetId: string]: TweetPartial;
    };
    users: {
      [userId: string]: UserPartial;
    };
  };
  timeline: {
    instructions: TimelineInstruction[];
  };
  errors?: TwitterAPIError[];
  guestToken?: string;
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
  type: 'photo' | 'video' | 'animated_gif';
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

type TweetCardBindingValues = {
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

type TweetCard = {
  binding_values: TweetCardBindingValues;
  name: string;
};

type TweetEntities = {
  urls?: TcoExpansion[];
  media?: TweetMedia[];
};

type TweetPartial = {
  card?: TweetCard;
  conversation_id_str: string;
  created_at: string; // date string
  display_text_range: [number, number];
  entities: TweetEntities;
  extended_entities: TweetEntities;
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
  profile_banner_url: string;
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

type TranslationPartial = {
  id_str: string;
  translationState: 'Success'; // TODO: figure out other values
  sourceLanguage: string;
  localizedSourceLanguage: string;
  destinationLanguage: string;
  translationSource: 'Google';
  translation: string;
  entities: TweetEntities;
};
