type ATProtoLabel = {
  cid: string; // id
  cts: string; // date
  src: string; // did source
  uri: string; // at:// url
  val: string; // value
};

declare type BlueskyImage = {
  alt: string;
  aspectRatio: {
    height: number;
    width: number;
  };
  fullsize: string;
  thumb: string;
};

declare type BlueskyExternalEmbed = {
  uri: string;
  title: string;
  description: string;
  thumb: {
    ref: {
      $link: string;
    };
    mimeType: string;
    size: number;
  };
};

declare type BlueskyVideo = {
  $type: 'app.bsky.embed.video#view';
  ref: {
    $link: string;
  };
  mimeType: 'video/mp4';
  size: number;
};

declare type BlueskyMedia = {
  $type: string;
  external: BlueskyExternalEmbed;
  images: BlueskyImage[];
  thumbnail: string;
  mimeType?: string;
  playlist: string;
  aspectRatio: {
    height: number;
    width: number;
  };
  ref?: {
    $link: string;
  };
  video?: BlueskyVideo;
};

declare type BlueskyEmbed = {
  images?: BlueskyImage[];
  video?: BlueskyVideo;
  media?: BlueskyMedia;
  external?: BlueskyExternalEmbed;
  record?: {
    value: BlueskyPost;
    record: BlueskyPost;
  };
  aspectRatio: {
    height: number;
    width: number;
  };
  playlist?: string;
  thumbnail?: string;
};
declare type BlueskyAuthor = {
  associated: {
    chat: {
      allowIncoming: 'all'; // TODO: figure out other values
    };
  };
  avatar: string;
  createdAt: string;
  did: string;
  displayName: string;
  handle: string;
  labels: ATProtoLabel[];
};

declare type BlueskyReply = {
  parent: {
    cid: string;
    uri: string;
  };
  root: {
    cid: string;
    uri: string;
  };
};

declare type BlueskyPost = {
  author: BlueskyAuthor;
  cid: string;
  embed: BlueskyEmbed;
  indexedAt: string;
  labels: ATProtoLabel[];
  likeCount: number;
  record: BlueskyRecord;
  value?: BlueskyRecord;
  repostCount: number;
  uri: string;
  embeds?: BlueskyEmbed[];
};

declare type BlueskyRecord = {
  createdAt: string;
  embed: BlueskyEmbed;
  langs: string[];
  text: string;
  reply: BlueskyReply;
  facets: BlueskyFacet[];
};

declare type BlueskyFacetFeature = {
  $type: string;
  uri?: string;
};

declare type BlueskyFacet = {
  features: BlueskyFacetFeature[];
  index: {
    byteStart: number;
    byteEnd: number;
  };
};

declare type BlueskyThread = {
  parent: BlueskyThread;
  post: BlueskyPost;
  replies?: BlueskyThread[];
};

declare type BlueskyThreadResponse = {
  thread: BlueskyThread;
};

interface BlueskyProcessBucket {
  posts: BlueskyPost[];
  allPosts: BlueskyPost[];
}
