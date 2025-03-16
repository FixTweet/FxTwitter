/* eslint-disable no-case-declarations */
import { Context } from "hono/dist/types/context";
import { Strings } from "../strings";
import { DataProvider, returnError } from "./status";
import { constructTwitterThread } from "../providers/twitter/conversation";
import { constructBlueskyThread } from "../providers/bsky/conversation";
import { Constants } from "../constants";
import { getSocialProof } from "../helpers/socialproof";
import i18next from 'i18next';
import icu from 'i18next-icu';
import { formatNumber } from "../helpers/utils";
import { decodeSnowcode } from "../helpers/snowcode";
import translationResources from '../../i18n/resources';


const generatePoll = (poll: APIPoll): string => {
  let str = '<blockquote>';

  const barLength = 32;

  poll.choices.forEach(choice => {
    const bar = '█'.repeat((choice.percentage / 100) * barLength);
    // eslint-disable-next-line no-irregular-whitespace
    str += `${bar}<br><b>${choice.label}</b>&emsp;${choice.percentage}%<br>︀︀<br>`;
  });

  /* Finally, add the footer of the poll with # of votes and time left */
  str += ''; /* TODO: Localize time left */
  str += i18next.t('pollVotes', {
    voteCount: formatNumber(poll.total_votes ?? 0),
    timeLeft: poll.time_left_en ?? ''
  });

  return str + '</blockquote>';
};

const getStatusText = (status: APIStatus) => {
  let text = '';
  const convertedStatusText = status.text.replace(/\n/g, '<br>︀︀');
  if ((status as APITwitterStatus).translation) {
    console.log('translation', JSON.stringify((status as APITwitterStatus).translation));
    const { translation } = status as APITwitterStatus;

    const formatText = `<b>📑 {translation}</b>`.format({
      translation: i18next.t('translatedFrom').format({
        language: i18next.t(`language_${translation?.source_lang}`)
      })
    });

    text = `${formatText}<br><br>${translation?.text}<br><br>`;
    text += `<blockquote><b>${i18next.t('ivOriginalText')}</b><br>${convertedStatusText}</blockquote>`;
  } else {
    text = convertedStatusText + '<br><br>';
  }
  if (status.poll) {
    text += `${generatePoll(status.poll)}`;
  }
  text += `<b>${getSocialProof(status)?.replace(/ {3}/g, '&ensp;')}</b>`;
  return text;
}

export const handleActivity = async (
  c: Context,
  snowcode: string,
  provider: DataProvider
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<Response> => {
  let language: string | null = null;
  let authorHandle: string | null = null;
  const decoded = decodeSnowcode(snowcode);
  const statusId = decoded.i;
  if (decoded.l) {
    language = decoded.l;
  }
  if (decoded.h) {
    authorHandle = decoded.h;
  }

  let thread: SocialThread;
  if (provider === DataProvider.Twitter) {
    thread = await constructTwitterThread(
      statusId,
      false,
      c,
      language ?? undefined,
      false
    );
  } else if (provider === DataProvider.Bsky) {
    thread = await constructBlueskyThread(
      statusId,
      authorHandle ?? '',
      false,
      c,
      language ?? undefined
    );
  } else {
    return returnError(c, Strings.ERROR_API_FAIL);
  }

  await i18next.use(icu).init({
    lng: language ?? thread.status?.lang ?? 'en',
    resources: translationResources,
    fallbackLng: 'en'
  });

  if (!thread.status) {
    return returnError(c, Strings.ERROR_API_FAIL);
  }

  const root = `${provider === DataProvider.Twitter ? Constants.TWITTER_ROOT : Constants.BSKY_ROOT}`;

  // Map FxEmbed API to Mastodon API v1
  const response = {
    id: statusId,
    url: `${root}/${thread.status.author.screen_name}/status/${statusId}`,
    uri: `${root}/${thread.status.author.screen_name}/status/${statusId}`,
    created_at: new Date(thread.status.created_at).toISOString(),
    edited_at: null,
    reblog: null,
    in_reply_to_id: thread.status.replying_to?.post,
    // in_reply_to_account_id: ,
    language: thread.status.lang,
    // TODO: Do formatting
    content: getStatusText(thread.status),
    spoiler_text: '',
    visibility: 'public',
    application: {
      name: thread.status.source,
      website: null,
    },
    media_attachments: [],
    account: {
      id: thread.status.author.id,
      display_name: thread.status.author.name,
      username: thread.status.author.screen_name,
      acct: thread.status.author.screen_name,
      url: thread.status.author.url,
      uri: thread.status.author.url,
      created_at: new Date(thread.status.author.joined).toISOString(),
      locked: false,
      bot: false,
      discoverable: true,
      indexable: false,
      group: false,
      avatar: thread.status.author.avatar_url,
      avatar_static: thread.status.author.avatar_url,
      header: thread.status.author.banner_url,
      header_static: thread.status.author.banner_url,
      followers_count: thread.status.author.followers,
      following_count: thread.status.author.following,
      statuses_count: thread.status.author.statuses,
      hide_collections: false,
      noindex: false,
      emojis: [],
      roles: [],
      fields: []
    },
    mentions: [],
    tags: [],
    emojis: [],
    card: null,
    poll: null
  };

  if ((thread.status.media?.all?.length ?? 0) > 0) {
    response['media_attachments'] = thread.status.media.all?.map((media) => {
      switch (media.type) {
        case 'photo':
          const image = media as APIPhoto;
          return {
            id: '114163769487684704',
            type: 'image',
            url: image.url,
            preview_url: image.url,
            remote_url: null,
            preview_remote_url: null,
            text_url: null,
            description: image.altText ?? null,
            meta: {
              original: {
                width: image.width,
                height: image.height,
                size: `${image.width}x${image.height}`,
                aspect: image.width / image.height
              }
            }
          };
        case 'video':
        case 'gif':
          const video = media as APIVideo;
          return {
            id: '114163769487684704',
            type: 'video',
            url: video.url,
            preview_url: video.thumbnail_url,
            remote_url: null,
            preview_remote_url: null,
            text_url: null,
            meta: {
              original: {
                width: video.width,
                height: video.height,
                size: `${video.width}x${video.height}`,
                aspect: video.width / video.height
              }
            }
          };
      }
    });
  }

  return c.json(response);
}