# pxTwitter // Twittpr

![](https://skillicons.dev/icons?i=typescript,webpack,workers)

[![Webpack](https://github.com/dangeredwolf/pxtwitter/actions/workflows/webpack.yml/badge.svg)](https://github.com/dangeredwolf/pxtwitter/actions/workflows/webpack.yml)

## A TwitFix-like service that _does way more_ with better privacy in mind.

### Embed videos, polls, Tweet translations, and more on Discord, Telegram, and others.

#### On Discord, send a Twitter link and type `s/e/p` to make `twittpr.com`.

#### Otherwise, just add `px` before `twitter` to make `pxtwitter.com`

<img src="https://camo.githubusercontent.com/b22920252aaa349afe4a3568dcf04c4522114b7739b004ee3b29dfd61593208c/68747470733a2f2f63646e2e646973636f72646170702e636f6d2f6174746163686d656e74732f3136353536303735313336333332353935322f313030303437373437303234313333333336382f7078747769747465722e77656270" width="600">

## Embed Videos

Let's face it — we all have videos of memes and other things from Twitter we want to quickly share with friends. With normal Twitter links, embedding videos is often broken on Discord and impossible on Telegram.

![](https://cdn.discordapp.com/attachments/165560751363325952/1000495191817453578/pxTwitter.png)

On Discord, we'll also automatically embed videos linked from other platforms, such as YouTube, so they can play without having to open a browser.

## Embed Polls

If you want to share the results of a Twitter poll, you can do so by just linking the Tweet using pxTwitter.

![](https://cdn.discordapp.com/attachments/165560751363325952/1000487446393397328/pxTwitter.png)

## Embed Quote Tweets & Media

Quote tweets and their media can provide important context to a Tweet. So we'll automatically add said context, and even media if there isn't already media embedded in the quote.

![](https://cdn.discordapp.com/attachments/165560751363325952/1000490187190702190/pxTwitter.png)

## Translate Tweets

Tweets in languages other than English will automagically be translated into English, with the original and translated text displayed as space allows.

Want to translate to a language that isn't English? No trouble, just add any supported language 2-letter ISO code afterward, like so:

![](https://cdn.discordapp.com/attachments/165560751363325952/1000579738248675338/pxTwitter.png)

## Direct media links

Want to link directly to a Tweet's media without the embed? You can do easily do that using pxTwitter.

![Image demonstrating the feature](https://pxtwitter.com/dangeredwolf/status/1548119328498728960.jpg)

There's a few supported ways to do this:

- Add `d.` or `dl.` before the domain (so, `d.twittpr.com` or `dl.pxtwitter.com`)
- Add `.mp4` to the end of videos or `.jpg` to the end of images, after the tweet ID
- Add `/dl` or `/dir` between the domain and the username

Examples from above:

- `https://d.twittpr.com/dangeredwolf/status/1548119328498728960`
- `https://pxtwitter.com/dangeredwolf/status/1548117889437208581.jpg`
- `https://pxtwitter.com/dl/dangeredwolf/status/1548117889437208581`

Tweets with multiple images are supported, so you can do something like this and it will pick the correct one:

`https://d.twittpr.com/dangeredwolf/status/1547514042146865153/photo/3`

Otherwise, it will default to the first image.

## Replace t.co shorteners with original link

The default Twitter embeds include t.co link shorteners, which make it difficult to know where the link is heading. We automatically replace t.co links with their original links to make things clearer.

## Color-matched embeds on Discord

We use Twitter's color data for either the first image/video of the tweet, or the author's profile picture. It makes the embed's appearance more _aesthetic_, as well as in line with the content of the Tweet.

## Built with privacy in mind

We don't save logs of what tweets you're sending, nor do we have a public record of what tweets are being embedded by pxTwitter. We use Cloudflare to cache pxTwitter responses to make repeat access faster.

Furthermore, if the person who posted a pxTwitter link forgot to strip tracking, we strip it upon redirecting to the Tweet.

---

## Why use pxTwitter?

In many ways, pxTwitter has richer embeds and does more. Here's a table comparing some of pxTwitter's features compared to Twitter default embeds as well as other embedding services

|                                         |                pxTwitter                 |         Twitter default          |          vxTwitter (BetterTwitFix)           |           Twxtter (sixFix)            |
| --------------------------------------- | :--------------------------------------: | :------------------------------: | :------------------------------------------: | :-----------------------------------: |
| Embed Tweets / Images                   |            :heavy_check_mark:            |        :heavy_check_mark:        |              :heavy_check_mark:              |          :heavy_check_mark:           |
| Embed profile pictures on text Tweets   |            :heavy_check_mark:            |               :x:                |              :heavy_check_mark:              |          :heavy_check_mark:           |
| Embed Twitter Videos                    |            :heavy_check_mark:            |               :x:¹               |              :heavy_check_mark:              |          :heavy_check_mark:           |
| Embed External Videos (YouTube, etc.)   |           :heavy_check_mark:⁶            |               :x:                |                     :x:⁴                     |                  :x:                  |
| Embed Poll results                      |            :heavy_check_mark:            |               :x:                |                     :x:                      |                  :x:                  |
| Embed Quote Tweets                      |            :heavy_check_mark:            |               :x:                |    :ballot_box_with_check: Without Media     | :ballot_box_with_check: Without Media |
| Embed Multiple Images                   | :ballot_box_with_check: Except Telegram⁵ | :heavy_minus_sign: Discord Only³ | :ballot_box_with_check: With c.vxtwitter.com |                  :x:                  |
| Translate Tweets                        |            :heavy_check_mark:            |               :x:                |                     :x:                      |                  :x:                  |
| Publicly accessible embed index         |                   :x:²                   |               N/A                |                     :x:²                     |          :heavy_check_mark:           |
| Replace t.co with original links        |            :heavy_check_mark:            |               :x:                |                     :x:                      |                  :x:                  |
| Media-based embed colors on Discord     |            :heavy_check_mark:            |               :x:                |                     :x:                      |                  :x:                  |
| Redirect to media file (wihout embed)   |            :heavy_check_mark:            |               :x:                |                     :x:                      |          :heavy_check_mark:           |
| Strip Twitter tracking info on redirect |            :heavy_check_mark:            |               :x:                |              :heavy_check_mark:              |          :heavy_check_mark:           |
| Show retweet, like, reply counts        |            :heavy_check_mark:            | :heavy_minus_sign: Discord Only³ |      :ballot_box_with_check: No replies      |  :ballot_box_with_check: No replies   |
| Discord sed replace (`s/`) friendly     |               twittpr.com                |               N/A                |                     :x:                      |          :heavy_check_mark:           |

¹ Discord will attempt to embed Twitter's video player, but it is unreliable

² Neither pxTwitter or vxTwitter have a public embed ledger, for privacy reasons. vxTwitter still stores all responses in a database / JSON file controlled by the owner. pxTwitter by contrast relies on Cloudflare caching of responses: there is no link store accessible to the owner.

³ Discord uses a custom embed container for Twitter.com to enable multi-image, which is unfortunately not available to other websites.

⁴ On GitHub, BetterTwitFix (vxTwitter) claims to support this feature, however in my testing as of mid-July 2022, this does not seem to work.

⁵ Telegram does not support WebP in embeds. We use WebP for multi-image mosaic for its combination of smaller file size and better text readability which makes it overall a better format than JPG or PNG for this purpose. In the future we will likely add a compatibility mode for Telegram.

⁶ External media requiring web containers, such as YouTube, won't embed in Telegram because Telegram doesn't support it. Plain media will work in Telegram, and it works either way inside Discord.

---

## Why pxTwitter is nicer to develop for and deploy

TwitFix and its derivatives have quite a few dependencies you need to rely on. You need to set up a server somewhere, install Python, all its dependencies, then either set up `youtube-dl` (more resource intensive) or [beg Twitter for API access](https://twitter.com/dangeredwolf/status/1438983606135832581), and optionally set up a database, otherwise it uses the file system to cache.

pxTwitter was written from the start as a lightweight, TypeScript-based Cloudflare Worker. Cloudflare Workers are completely free for up to 100,000 requests per day, per account. Cloudflare Workers are [fast to set up](https://developers.cloudflare.com/workers/get-started/guide/) and your script is distributed in their datacenters around the world for lower latency.

pxTwitter does not need a database nor a Twitter API key: It takes a similar approach to `youtube-dl` where it pretends to be a logged-out Twitter web user, fetching a guest token and making API requests from there. As far as I can tell, this basically means we have "unlimited" read-only access to Twitter's API, including things they don't expose in their public API, useful for polls and other features.

## Deploy pxTwitter yourself

Clone the repo, install [Node.js](https://nodejs.org/) and run `npm install` in the repo directory. Copy `wrangler.example.toml` to `wrangler.toml` and add your [Cloudflare account ID](https://developers.cloudflare.com/fundamentals/get-started/basic-tasks/find-account-and-zone-ids/), and change the name of your worker if you need to. Also copy `.env.example` to `.env` and change HOST_URL, DIRECT_MEDIA_DOMAINS to your desired domain and whatever else you need to do. Authenticate with Cloudflare with `npx wrangler login`, then do `npx wrangler publish` (or `npm run publish`).

[If you have more questions about setting up Cloudflare Workers, check out their Getting Started guide](https://developers.cloudflare.com/workers/get-started/guide/).

Once you're set up with your worker on `*.workers.dev`, [add your worker to your custom domain](https://developers.cloudflare.com/workers/platform/routing/custom-domains/).

---

**Licensed under the permissive MIT license. Feel free to send a pull request!**

### Things to tackle in the future

- Returning JPG with multi-image for Telegram as it doesn't support WebP in embeds for some reason

### Bugs or issues?

Feel free to [open an issue](https://github.com/pxTwitter/pxTwitter/issues), or [ping me on Twitter and I'll see what I can do](https://twitter.com/dangeredwolf).
