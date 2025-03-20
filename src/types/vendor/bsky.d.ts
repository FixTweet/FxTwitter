type ATProtoLabel = {
  cid: string; // id
  cts: string; // date
  src: string; // did source
  uri: string; // at:// url
  val: string; // value
};

type BlueskyImage = {
  alt: string;
  aspectRatio: {
    height: number;
    width: number;
  };
  fullsize: string;
  thumb: string;
};

type BlueskyExternalEmbed = {
  uri: string;
  title: string;
  description: string;
  thumb: string;
};

type BlueskyVideo = {
  $type: 'app.bsky.embed.video#view';
  ref: {
    $link: string;
  };
  mimeType: 'video/mp4';
  size: number;
};

type BlueskyMedia = {
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

type BlueskyEmbed = {
  images?: BlueskyImage[];
  video?: BlueskyVideo;
  media?: BlueskyMedia;
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
type BlueskyAuthor = {
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

type BlueskyReply = {
  parent: {
    cid: string;
    uri: string;
  };
  root: {
    cid: string;
    uri: string;
  };
};

type BlueskyPost = {
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

type BlueskyRecord = {
  createdAt: string;
  embed: BlueskyEmbed;
  langs: string[];
  text: string;
  reply: BlueskyReply;
  facets: BlueskyFacet[];
};

type BlueskyFacetFeature = {
  $type: string;
  uri?: string;
};

type BlueskyFacet = {
  features: BlueskyFacetFeature[];
  index: {
    byteStart: number;
    byteEnd: number;
  };
};

type BlueskyThread = {
  parent: BlueskyThread;
  post: BlueskyPost;
  replies?: BlueskyThread[];
};

type BlueskyThreadResponse = {
  thread: BlueskyThread;
};

interface BlueskyProcessBucket {
  posts: BlueskyPost[];
  allPosts: BlueskyPost[];
}
