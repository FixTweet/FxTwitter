import { Context } from 'hono';
import { Constants } from '../../constants';

export const buildAPIBskyPost = async (
  c: Context,
  thread: BlueskyThreadResponse,
  language: string | undefined
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<APIStatus> => {
  const status = thread.thread.post;
  const apiStatus: APIStatus = {} as APIStatus;
  apiStatus.id = status.cid;
  apiStatus.text = status.record.text;
  apiStatus.author = {
    id: status.author.handle,
    name: status.author.displayName,
    screen_name: status.author.handle,
    avatar_url: status.author.avatar,
    banner_url: '', // TODO: Pull this from the actual author endpoint
    description: '',
    location: '',
    followers: 0,
    following: 0,
    likes: 0,
    url: `${Constants.BSKY_ROOT}/profile/${status.author.handle}`,
    protected: false,
    statuses: 0,
    joined: status.author.createdAt,
    birthday: {
      day: 0,
      month: 0,
      year: 0
    },
    website: {
      url: '',
      display_url: ''
    }
  };
  apiStatus.created_at = status.record.createdAt;
  apiStatus.media = {};

  console.log('embed', status.embed);

  apiStatus.media.photos = (status.embed.images || []).map(image => {
    return {
      type: 'photo',
      width: image.aspectRatio.width,
      height: image.aspectRatio.height,
      url: image.fullsize,
      altText: image.alt
    };
  });
  if (status.record.embed.video) {
    apiStatus.media.videos = [
      {
        type: 'video',
        url: status.embed.playlist ?? `${Constants.BSKY_VIDEO_BASE}/watch/did:plc:${status.record.embed.video?.ref.$link}/720p/video.m3u8`,
        format: status.record.embed.video?.mimeType ?? 'video/mp4',
        thumbnail_url: status.embed.thumbnail ?? `${Constants.BSKY_VIDEO_BASE}/watch/did:plc:${status.record.embed.video?.ref.$link}/thumbnail.jpg`,
        variants: [],
        width: status.embed.aspectRatio.width,
        height: status.embed.aspectRatio.height,
        duration: 0
      }
    ];
  }
  apiStatus.media.all = (apiStatus.media.photos as APIMedia[] || []).concat(apiStatus.media.videos ?? []);

  apiStatus.likes = status.likeCount;
  apiStatus.replies = 0;
  apiStatus.reposts = status.repostCount;
  apiStatus.source = 'Bluesky Social';
  apiStatus.url = `${Constants.BSKY_ROOT}/profile/${status.author.handle}/post/${status.cid}`;

  return apiStatus;
};
