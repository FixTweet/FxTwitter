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

type BlueskyVideo = {
  ref: {
    "$link": string
  },
  mimeType: "video/mp4",
  size: number
}

type BlueskyEmbed = {
  images?: BlueskyImage[];
  video?: BlueskyVideo;
  aspectRatio: {
    height: number;
    width: number;
  }
  playlist?: string
  thumbnail?: string
}
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

type BlueskyPost = {
  author: BlueskyAuthor;
  cid: string;
  embed: BlueskyEmbed;
  indexedAt: string;
  labels: ATProtoLabel[];
  likeCount: number;
  record: BlueskyRecord;
  repostCount: number;
  uri: string;
};

type BlueskyRecord = {
  createdAt: string;
  embed: BlueskyEmbed;
  langs: string[];
  text: string;
};

type BlueskyThread = {
  post: BlueskyPost;
  replies: BlueskyPost[];
};

type BlueskyThreadResponse = {
  thread: BlueskyThread;
};

interface BlueskyProcessBucket {
  posts: BlueskyPost[];
  allPosts: BlueskyPost[];
}
