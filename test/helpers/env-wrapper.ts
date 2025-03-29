/* eslint-disable @typescript-eslint/no-unused-vars */
export default {
  TwitterProxy: {
    fetch: async (request: string) => {
      console.log('HIIIIIIIIIIIIIIIIIIIIIIIIII from elongator');
      console.log(request);
      return new Response('Hello, world!');
    }
  }
}