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

/* TODO: Are there more states for ext_views?
   Legacy Tweets use Enabled but have no count, while newer tweets have EnabledWithCount
   and count is populated with a string. */
type ExtViews = {
  state: 'Enabled' | 'EnabledWithCount';
  count?: string;
};

type TweetPartial = {
  card?: TweetCard;
  conversation_id_str: string;
  created_at: string; // date string
  display_text_range: [number, number];
  entities: TweetEntities;
  extended_entities: TweetEntities;
  ext_views?: ExtViews;
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
  retweeted_status_id: number;
  retweeted_status_id_str: string;
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

type GraphQLUserResponse = {
  data: {
    user: {
      result: GraphQLUser;
    }
  }
}

type GraphQLUser = {
  __typename: "User",
  id: string; // "VXNlcjozNzg0MTMxMzIy",
  "rest_id": string; // "3784131322",
  "affiliates_highlighted_label": Record<string, unknown>; // {},
  "is_blue_verified": boolean; // false,
  "profile_image_shape": 'Circle' | 'Square'; // "Circle",
  "legacy": {
    "created_at": string; // "Sat Sep 26 17:20:55 +0000 2015",
    "default_profile": boolean // false,
    "default_profile_image": boolean // false,
    "description": string; // "dangered wolf#3621 https://t.co/eBTS4kksMw",
    "entities": {
      "description": {
        "urls": {
          "display_url": string; // "t.me/dangeredwolf",
          "expanded_url": string; // "http://t.me/dangeredwolf",
          "url": string; // "https://t.co/eBTS4kksMw",
          "indices": [
            19,
            42
          ]
        }[]
      }
    },
    "fast_followers_count": 0,
    "favourites_count": number; // 126708,
    "followers_count": number; // 4996,
    "friends_count": number; // 2125,
    "has_custom_timelines": boolean; // true,
    "is_translator": boolean; // false,
    "listed_count": number; // 69,
    "location": string; // "they/them",
    "media_count": number; // 20839,
    "name": string; // "dangered wolf",
    "normal_followers_count": number; // 4996,
    "pinned_tweet_ids_str": string[]; // Array of tweet ids
    "possibly_sensitive": boolean; // false,
    "profile_banner_url": string; // "https://pbs.twimg.com/profile_banners/3784131322/1658599775",
    "profile_image_url_https": string; // "https://pbs.twimg.com/profile_images/1555638673705783299/3gaaetxC_normal.jpg",
    "profile_interstitial_type": string; // "",
    "screen_name": string; // "dangeredwolf",
    "statuses_count": number; // 108222,
    "translator_type": string; // "regular",
    "verified": boolean; // false,
    "withheld_in_countries": []
  },
  "professional": {
    "rest_id": string; // "1508134739420536845",
    "professional_type": string; // "Creator",
    "category": [
      {
        "id": number; // 354,
        "name": string // "Fish & Chips Restaurant",
        "icon_name": string; // "IconBriefcaseStroke"
      }
    ]
  },
  "legacy_extended_profile": {
    birthdate?: {
      day: number; // 7,
      month: number; // 1,
      visibility: string; // "Public"
      year: number; // 2000
      year_visibility: string; // "Public"
    };
    profile_image_shape: string; // "Circle",
    rest_id: string; // "3784131322",
  },
  "is_profile_translatable": false,
  "verification_info": {
    reason: {
      description: {
        entities: {
          from_index: number; // 98,
          ref: {
            url: string; // "https://help.twitter.com/managing-your-account/about-twitter-verified-accounts",
            url_type: string; // "ExternalUrl"
          };
          to_index: number; // 108
        }[];
        text: string; // "This account is verified because it’s subscribed to Twitter Blue or is a legacy verified account. Learn more"
      }
    }
  },
  "business_account": {}

}