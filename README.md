# pxTwitter

[![Webpack](https://github.com/dangeredwolf/pxtwitter/actions/workflows/webpack.yml/badge.svg)](https://github.com/dangeredwolf/pxtwitter/actions/workflows/webpack.yml)

## A TwitFix-like solution written in TypeScript for Cloudflare Workers.

### Embed videos, polls, and more on Discord, Telegram, and more! Just add `px` before `twitter` to make `pxtwitter.com`

### ... Or on Discord, send a normal Twitter link and type `s/e/p` to replace the domain with `twittpr.com`.

![https://cdn.discordapp.com/attachments/165560751363325952/997386462343462972/pxtwitter.png](https://cdn.discordapp.com/attachments/165560751363325952/997386462343462972/pxtwitter.png)

:heavy_check_mark: **Embed Videos** (Including Twitter videos and compatible external providers, such as YouTube)

:heavy_check_mark: **Embed Poll results**

:heavy_check_mark: **Embed Quote Tweets** (Including their media, if it doesn't conflict with the linked tweet)

:heavy_check_mark: **Replace embedded t.co shortener with original links**

:heavy_check_mark: **Creates media/profile picture color-matching theme-color** (looks great on Discord!)

:heavy_check_mark: **Better privacy: We don't save tweets or their media** (Outside of temporary Cloudflare caching for speed)

---

Here's a little chart comparing features to Twitter default embeds and other embedding services

|                                       |     pxTwitter      |         Twitter default          |    vxTwitter (BetterTwitFix)     |         Twxtter (sixFix)         |
| ------------------------------------- | :----------------: | :------------------------------: | :------------------------------: | :------------------------------: |
| Embed Tweets / Photos                 | :heavy_check_mark: |        :heavy_check_mark:        |        :heavy_check_mark:        |        :heavy_check_mark:        |
| Embed Videos                          | :heavy_check_mark: |               :x:¹               |        :heavy_check_mark:        |        :heavy_check_mark:        |
| Embed Poll results                    | :heavy_check_mark: |               :x:                |               :x:                |               :x:                |
| Embed Quote Tweets                    | :heavy_check_mark: |               :x:                | :heavy_minus_sign: Without Media | :heavy_minus_sign: Without Media |
| Embed Multiple Images                 |        :x:         | :heavy_minus_sign: Discord Only³ |       With c.vxtwitter.com       |               :x:                |
| Publicly accessible embed index       |        :x:²        |               N/A                |               :x:²               |        :heavy_check_mark:        |
| Replace t.co with original links      | :heavy_check_mark: |               :x:                |               :x:                |               :x:                |
| Media-based embed colors on Discord   | :heavy_check_mark: |               :x:                |               :x:                |               :x:                |
| Redirect to media file (wihout embed) | :heavy_check_mark: |               :x:                |               :x:                |        :heavy_check_mark:        |

¹ Discord will attempt to embed Twitter's video player, but it is unreliable

² Neither pxTwitter or vxTwitter have a public embed ledger, for privacy reasons. vxTwitter still stores all responses in a database / JSON file controlled by the owner. pxTwitter by contrast relies on Cloudflare caching of responses: there is no link store accessible to the owner.

³ Discord uses a custom embed container for Twitter.com to enable multi-image, which is unfortunately not available to other websites.

---

## Why pxTwitter is better to develop for and deploy

TwitFix and derivatives have quite a few dependencies you need to rely on. You need to set up a server somewhere, install Python, all its dependencies, then either set up `youtube-dl` (more resource intensive) or [beg Twitter for API access](https://twitter.com/dangeredwolf/status/1438983606135832581), and optionally set up a database, otherwise it uses the file system to cache.

pxTwitter was written from the start as a lightweight, TypeScript-based Cloudflare Worker. Cloudflare Workers are completely free for up to 100,000 requests per day, per account. Cloudflare Workers are [fast to set up](https://developers.cloudflare.com/workers/get-started/guide/) and your script is distributed in their datacenters around the world for lower latency.

pxTwitter does not need a database nor a Twitter API key: It takes a similar approach to `youtube-dl` where it pretends to be a logged-out Twitter web user, fetching a guest token and making API requests from there. As far as I can tell, this basically means we have "unlimited" read-only access to Twitter's API, including things they don't expose in their public API, useful for polls and other features.

## Deploy pxTwitter yourself

Clone the repo, install [Node.js](https://nodejs.org/) and run `npm install` in the repo directory. Copy `wrangler.example.toml` to `wrangler.toml` and add your [Cloudflare account ID](https://developers.cloudflare.com/fundamentals/get-started/basic-tasks/find-account-and-zone-ids/), and change the name of your worker if you need to. Authenticate with Cloudflare with `npx wrangler login`, then do `npx wrangler publish` (or `npm run publish`).

[If you have more questions about setting up Cloudflare Workers, check out their Getting Started guide](https://developers.cloudflare.com/workers/get-started/guide/).

Once you're set up with your worker on `*.workers.dev`, [add your worker to your custom domain](https://developers.cloudflare.com/workers/platform/routing/custom-domains/).

---

**Licensed under the permissive MIT license. Feel free to send a pull request!**

### Things to tackle in the future

- A subdomain to directly link to a tweet's image/video, without embeds (thanks @TheAppleFreak!)
- Combining multiple images together (would be outside CF Worker)
- Caching guest token (So we don't have to bother Twitter for one on every request)

### Bugs or issues?

Feel free to [open an issue](https://github.com/dangeredwolf/pxTwitter/issues), or [ping me on Twitter and I'll see what I can do](https://twitter.com/dangeredwolf).
