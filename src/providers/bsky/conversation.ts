import { Context } from 'hono';
import { buildAPIBskyPost } from './processor';
import { Constants } from '../../constants';

const fetchThread = async (
  post: string,
  author: string,
  depth = 10
): Promise<BlueskyThreadResponse | null> => {
  const atUri = encodeURIComponent(`at://${author}/app.bsky.feed.post/${post}`);
  const url = `${Constants.BSKY_API_ROOT}/xrpc/app.bsky.feed.getPostThread?uri=${atUri}&depth=${depth}`;

  if (!author || !post) {
    return null;
  }
  console.log('requesting', url)
  const res = await fetch(url);
  console.log('res', JSON.stringify(res));
  if (!res.ok) {
    console.log('EPIC FAIL!!!!!', res.status, await res.text());
    return null;
  }
  return await res.json();
};

export const fetchBskyThread = async (
  post: string,
  author: string,
  processThread = false,
  c: Context
) => {
  console.log(`Fetching post ${post} by ${author}`)
  const thread = await fetchThread(post, author, 10);
  if (!thread) {
    return null;
  }

  return thread;
};


export const constructBlueskyThread = async (
  id: string,
  author: string,
  processThread = false,
  c: Context,
  language: string | undefined
): Promise<SocialThread> => {
  const thread = await fetchBskyThread(id, author, processThread, c);
  // console.log('thread??', thread)

  if (!thread) {
    return {
      status: null,
      thread: [],
      author: null,
      code: 404
    };
  }

  const consumedPost = await buildAPIBskyPost(c, thread.thread.post, language);
  // console.log('consumedPost', consumedPost)

  return {
    status: consumedPost,
    thread: [consumedPost],
    author: consumedPost.author,
    code: 200
  };
};
