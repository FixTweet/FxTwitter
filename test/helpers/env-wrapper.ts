/* eslint-disable no-case-declarations */
// Wrapper for elongator TwitterProxy to handle mock requests for testing
export default {
  TwitterProxy: {
    fetch: async (request: string) => {
      // get start of API base
      // examples starters:
      // https://x.com/i/api/graphql
      // https://twitter.com/i/api/graphql
      // https://api.twitter.com/graphql
      // https://api.x.com/graphql
      const url = new URL(request);
      const apiMethod = url.pathname.match(/(?<=(\/i\/api\/)?graphql\/\w+\/)\w+/)?.[0];
      if (!apiMethod) {
        throw new Error('Invalid request');
      }
      const variables = JSON.parse(decodeURIComponent(url.searchParams.get('variables') ?? '{}'));
      console.log('Method:', apiMethod);
      console.log('Variables:', variables);

      switch(apiMethod) {
        case 'UserByScreenName':
          const screenName = variables.screen_name;
          // load mock based on screen name
          try {
            const mock = await import(`../mocks/UserByScreenName/${screenName}.json`);
            console.log('Mock data:', mock);
            return new Response(JSON.stringify(mock));
          } catch (error) {
            console.error('Error loading mock:', error);
            return new Response(JSON.stringify({data:{}}));
          }
        case 'TweetDetail':
          const focalTweetId = variables.focalTweetId;
          // load mock based on tweet id
          try {
            const mock = await import(`../mocks/TweetDetail/${focalTweetId}.json`);
            console.log('Mock data:', mock);
            return new Response(JSON.stringify(mock));
          } catch (error) {
            console.error('Error loading mock:', error);
          }
          return new Response(JSON.stringify({data:{}}));
        case 'TweetResultByRestId':
          const tweetId = variables.tweetId;
          // load mock based on tweet id
          try {
            const mock = await import(`../mocks/TweetResultByRestId/${tweetId}.json`);
            console.log('Mock data:', mock);
            return new Response(JSON.stringify(mock));
          } catch (error) {
            console.error('Error loading mock:', error);
          }
          return new Response(JSON.stringify({data:{}}));
        default:
          throw new Error('Invalid request');
      }
    }
  }
}