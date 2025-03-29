export default {
  async fetch(_request: Request, _env: any, _ctx: ExecutionContext): Promise<Response> {
    return new Response('Hello, world!');
  }
};