import { Context } from "hono";
// import { Experiment, experimentCheck } from "../../experiments";
import { twitterFetch } from "../../fetch";
import { Constants } from "../../constants";

export const fetchLiveVideoStream = async (
  mediaKey: string,
  c: Context,
  // useElongator = experimentCheck(
  //   Experiment.ELONGATOR_BY_DEFAULT,
  //   typeof c.env?.TwitterProxy !== 'undefined'
  // )
): Promise<LiveStreamBroadcast> => {
  return await twitterFetch(
    c,
    `${Constants.TWITTER_API_ROOT}/1.1/live_video_stream/status/${mediaKey}?client=web&use_syndication_guest_id=false&cookie_set_host=twitter.com`,
    false, /* TODO: Figure out why elongator is broken with this endpoint */
    (response) => !!((response as LiveStreamBroadcast).source?.location)
  ) as LiveStreamBroadcast;
}