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
  console.log('requesting', url);
  const res = await fetch(url);
  console.log('res', JSON.stringify(res));
  if (!res.ok) {
    console.log('EPIC FAIL!!!!!', res.status, await res.text());
    return null;
  }
  return await res.json();
};

export const fetchBskyThread = async (post: string, author: string, processThread = false) => {
  console.log(`Fetching post ${post} by ${author}`);
  const thread = await fetchThread(post, author, processThread ? 10 : 1);
  if (!thread) {
    return null;
  }

  return thread;
};

const followReplyChain = (thread: BlueskyThread): BlueskyPost[] => {
  if (!thread.replies)
    return [];
  
  for (const _post of thread.replies) {
    const post = _post.post;
    if (!post || post.author.did !== thread.post.author.did) {
      continue;
    }
    console.log('checking post', post);
    console.log('reply', post.record?.reply.parent.cid);
    if (post.record?.reply.parent.cid === thread.post.cid) {
      console.log('found it');
      const bucket = [post];
      const replies = _post.replies ? followReplyChain(_post) : [];
      return bucket.concat(replies);
    }
  }
  return [];
};

export const constructBlueskyThread = async (
  id: string,
  author: string,
  processThread = false,
  c: Context,
  language: string | undefined
): Promise<SocialThread> => {
  const _thread = await fetchBskyThread(id, author, processThread);

  if (!_thread) {
    return {
      status: null,
      thread: [],
      author: null,
      code: 404
    };
  }
  const thread = _thread?.thread;
  const bucket: BlueskyPost[] = [];

  if (processThread) {
    // loop through chain of parents
    if (thread.parent) {
      let parent = thread.parent;
      while (parent && parent?.post) {
        bucket.unshift(parent.post);
        parent = parent.parent;
      }
    }
    bucket.push(thread.post);
    if (thread.replies) {
      let threadPiece = thread;
      const totalReplies = [];
      let replies = followReplyChain(threadPiece);

      while (replies.length > 8) {
        // Load more replies
        const id = replies[replies.length - 1].uri.match(/(?<=post\/)(\w*)/g)?.[0] ?? '';
        console.log('Fetching next thread piece', id);
        const _threadPiece = await fetchBskyThread(id, author, true);
        if (!_threadPiece) {
          break;
        }
        threadPiece = _threadPiece.thread;
        const moreReplies = followReplyChain(threadPiece);
        if (!moreReplies.length) {
          break;
        }
        replies = moreReplies;
        totalReplies.push(...replies);
      }

      bucket.push(...totalReplies);
    }
  } else {
    bucket.push(thread.post);
  }

  const consumedPost = await buildAPIBskyPost(c, thread.post, language);

  const consumedPosts = await Promise.all(
    bucket.map(async post => {
      return await buildAPIBskyPost(c, post, language);
    })
  );
  // console.log('consumedPost', consumedPost)

  return {
    status: consumedPost,
    thread: consumedPosts,
    author: consumedPost.author,
    code: 200
  };
};
