# FixTweet (formerly pxTwitter)

## Embed Twitter videos, polls, translations, & more on Discord and Telegram!

![](https://skillicons.dev/icons?i=typescript,webpack,workers)

[![Webpack](https://github.com/dangeredwolf/FixTweet/actions/workflows/webpack.yml/badge.svg)](https://github.com/dangeredwolf/FixTweet/actions/workflows/webpack.yml) [![Tests](https://github.com/dangeredwolf/FixTweet/actions/workflows/tests.yml/badge.svg)](https://github.com/dangeredwolf/FixTweet/actions/workflows/tests.yml)

## Inspired by [RobinUniverse's TwitFix](https://github.com/robinuniverse/TwitFix), but rewritten in TypeScript as a Cloudflare Worker to scale, while also being packed with even more features.

### Add `fx` before your Twitter link to make it `fxtwitter.com` (Alternative: `pxtwitter.com`)

### In a hurry? On Discord, send a Twitter link and type `s/e/p` to make `twittpr.com`.

<img src="https://camo.githubusercontent.com/b22920252aaa349afe4a3568dcf04c4522114b7739b004ee3b29dfd61593208c/68747470733a2f2f63646e2e646973636f72646170702e636f6d2f6174746163686d656e74732f3136353536303735313336333332353935322f313030303437373437303234313333333336382f7078747769747465722e77656270" width="600">

## Embed Videos

Let's face it — we all have videos of memes and other things from Twitter we want to quickly share with friends. With normal Twitter links, embedding videos is often broken on Discord and impossible on Telegram. But using FixTweet, we embed the raw mp4 file so it's compatible with just about anything supporting video embeds.

![](https://cdn.discordapp.com/attachments/165560751363325952/1000495191817453578/pxTwitter.png)

On Discord, we'll also automatically embed videos linked from other platforms, such as YouTube, so they can play without having to open a browser.

## Embed Polls

If you want to share the results of a Twitter poll, you can do so by just linking the Tweet using FixTweet.

![](https://cdn.discordapp.com/attachments/165560751363325952/1000487446393397328/pxTwitter.png)

## Embed Quote Tweets & Media

Quote tweets and their media can provide important context to a Tweet. So we'll automatically add said context, and even media if there isn't already media embedded in the quote.

![](https://cdn.discordapp.com/attachments/165560751363325952/1000490187190702190/pxTwitter.png)

## Translate Tweets

You can translate a tweet into any other supported language, with the original and translated text displayed as space allows.

Just append a tweet with its 2-letter ISO language code. So for English, add `/en` at the end.

![](https://cdn.discordapp.com/attachments/165560751363325952/1000890584153735238/FixTweet.png)

## Direct media links

Want to link directly to a Tweet's media without the embed? You can do easily do that using FixTweet.

![Image demonstrating the feature](https://fxtwitter.com/dangeredwolf/status/1548119328498728960.jpg)

There's a few supported ways to do this:

- Add `d.` or `dl.` before the domain (so, `d.twittpr.com` or `dl.fxtwitter.com`)
- Add `.mp4` to the end of videos or `.jpg` to the end of images, after the tweet ID
- Add `/dl` or `/dir` between the domain and the username

Examples from above:

- `https://d.twittpr.com/dangeredwolf/status/1548119328498728960`
- `https://fxtwitter.com/dangeredwolf/status/1548117889437208581.jpg`
- `https://fxtwitter.com/dl/dangeredwolf/status/1548117889437208581`

Tweets with multiple images are supported, so you can do something like this and it will pick the correct one:

`https://d.twittpr.com/dangeredwolf/status/1547514042146865153/photo/3`

Otherwise, it will default to the first image.

## Replace t.co shorteners with original link

The default Twitter embeds include t.co link shorteners, which make it difficult to know where the link is heading. We automatically replace t.co links with their original links to make things clearer.

## Color-matched embeds on Discord

We use Twitter's color data for either the first image/video of the tweet, or the author's profile picture. It makes the embed's appearance more _aesthetic_, as well as in line with the content of the Tweet.

## Built with privacy in mind

FixTweet doesn't save logs of what tweets you're sending, nor do we have a public record of what tweets are being embedded by FixTweet.

In fact, because our core embedding and API service uses Cloudflare Workers, where FixTweet can only run when you send it a request and its memory doesn't stick around, and it doesn't have a file system or database to access at all. That is how we keep our privacy promise by building it into the architecture. My goal is always to provide a good public service, and FixTweet doesn't make any money.

Note: We use Cloudflare to cache FixTweet responses to make repeat access faster, which have a maximum TTL of 1 hour. Temporary real-time logging in the terminal (specifically `wrangler tail`) may be used only by the developer while the Worker is being serviced or debugged (to make sure things work as they should), however these logs are only shown in the terminal and are never saved or used for any other purpose. URLs that cause runtime errors in the script (aka Exceptions, usually exceedingly rare unless there was a faulty update pushed out) may be logged for a developer to diagnose the issue that is preventing your embed from working.

On a different note, if the person who posted a FixTweet link forgot to strip tracking parameters (like `?s` and `&t`), we strip it upon redirecting to the Tweet as they are only used for Twitter Telemetry and Marketing.

---

## Why use FixTweet?

In many ways, FixTweet has richer embeds and does more. Here's a table comparing some of FixTweet's features compared to Twitter default embeds as well as other embedding services

|                                         |              FixTweet               |         Twitter default          |          vxTwitter (BetterTwitFix)           |           Twxtter (sixFix)            |
| --------------------------------------- | :---------------------------------: | :------------------------------: | :------------------------------------------: | :-----------------------------------: |
| Embed Tweets / Images                   |         :heavy_check_mark:          |        :heavy_check_mark:        |              :heavy_check_mark:              |          :heavy_check_mark:           |
| Embed profile pictures on text Tweets   |         :heavy_check_mark:          |               :x:                |              :heavy_check_mark:              |          :heavy_check_mark:           |
| Embed Twitter Videos                    |         :heavy_check_mark:          |               :x:¹               |              :heavy_check_mark:              |          :heavy_check_mark:           |
| Embed External Videos (YouTube, etc.)   |         :heavy_check_mark:⁶         |               :x:                |                     :x:⁴                     |                  :x:                  |
| Embed Poll results                      |         :heavy_check_mark:          |               :x:                |                     :x:                      |                  :x:                  |
| Embed Quote Tweets                      |         :heavy_check_mark:          |               :x:                |    :ballot_box_with_check: Without Media     | :ballot_box_with_check: Without Media |
| Embed Multiple Images                   |         :heavy_check_mark:⁵         | :heavy_minus_sign: Discord Only³ | :ballot_box_with_check: With c.vxtwitter.com |                  :x:                  |
| Translate Tweets                        |         :heavy_check_mark:          |               :x:                |                     :x:                      |                  :x:                  |
| Publicly accessible embed index         |                :x:²                 |               N/A                |                     :x:²                     |          :heavy_check_mark:           |
| Replace t.co with original links        |         :heavy_check_mark:          |               :x:                |                     :x:                      |                  :x:                  |
| Media-based embed colors on Discord     |         :heavy_check_mark:          |               :x:                |                     :x:                      |                  :x:                  |
| Redirect to media file (wihout embed)   |         :heavy_check_mark:          |               :x:                |                     :x:                      |          :heavy_check_mark:           |
| Strip Twitter tracking info on redirect |         :heavy_check_mark:          |               :x:                |              :heavy_check_mark:              |          :heavy_check_mark:           |
| Show retweet, like, reply counts        |         :heavy_check_mark:          | :heavy_minus_sign: Discord Only³ |      :ballot_box_with_check: No replies      |  :ballot_box_with_check: No replies   |
| Discord sed replace (`s/`) friendly     | :ballot_box_with_check: twittpr.com |               N/A                |                     :x:                      |          :heavy_check_mark:           |
| Tweet fetch API for Developers          |         :heavy_check_mark:          |               N/A                |                     :x:                      |          :heavy_check_mark:           |

¹ Discord will attempt to embed Twitter's video player, but it is unreliable

² Neither FixTweet or vxTwitter have a public embed ledger, for privacy reasons. vxTwitter still stores all responses in a database / JSON file controlled by the owner. FixTweet by contrast relies on Cloudflare caching of responses: there is no link store accessible to the owner.

³ Discord uses a custom embed container for Twitter.com to enable multi-image, which is unfortunately not available to other websites.

⁴ On GitHub, BetterTwitFix (vxTwitter) claims to support this feature, however in my testing as of mid-July 2022, this does not seem to work.

⁵ We've temporarily paused multi-image on Telegram due to issues with its embedding service that can cause images to sometimes not show up at all. ([#15](https://github.com/dangeredwolf/FixTweet/issues/15)) However, multi-image continues to work in Discord and most other platforms.

⁶ External media requiring web containers, such as YouTube, won't embed in Telegram because Telegram doesn't support it. Plain media will work in Telegram, and it works either way inside Discord.

---

## Why FixTweet is nicer to develop for and deploy

TwitFix and its derivatives have quite a few dependencies you need to rely on. You need to set up a server somewhere, install Python, all its dependencies, then either set up `youtube-dl` (more resource intensive) or [beg Twitter for API access](https://twitter.com/dangeredwolf/status/1438983606135832581), and optionally set up a database, otherwise it uses the file system to cache.

FixTweet was written from the start as a lightweight, TypeScript-based Cloudflare Worker. Cloudflare Workers are completely free for up to 100,000 requests per day, per account. Cloudflare Workers are [fast to set up](https://developers.cloudflare.com/workers/get-started/guide/) and your script is distributed in their datacenters around the world for lower latency.

FixTweet does not need a database nor a Twitter API key: It takes a similar approach to `youtube-dl` where it pretends to be a logged-out Twitter web user, fetching a guest token and making API requests from there. As far as I can tell, this basically means we have "unlimited" read-only access to Twitter's API, including things they don't expose in their public API, useful for polls and other features.

## Deploy FixTweet yourself

Clone the repo, install [Node.js](https://nodejs.org/) and run `npm install` in the repo directory. Copy `wrangler.example.toml` to `wrangler.toml` and add your [Cloudflare account ID](https://developers.cloudflare.com/fundamentals/get-started/basic-tasks/find-account-and-zone-ids/), and change the name of your worker if you need to. Also copy `.env.example` to `.env` and change HOST_URL, DIRECT_MEDIA_DOMAINS to your desired domain and whatever else you need to do. Authenticate with Cloudflare with `npx wrangler login`, then do `npx wrangler publish` (or `npm run publish`).

[If you have more questions about setting up Cloudflare Workers, check out their Getting Started guide](https://developers.cloudflare.com/workers/get-started/guide/).

Once you're set up with your worker on `*.workers.dev`, [add your worker to your custom domain](https://developers.cloudflare.com/workers/platform/routing/custom-domains/).

Populate Sentry details in your `.env` to use Sentry in your product to catch exceptions.

---

## Q&A

### What's the difference between `fxtwitter.com`, `pxtwitter.com`, and `twittpr.com`?

They all run the exact same worker and have no difference to end users... you can use whatever you'd like!

However, we do consider `fxtwitter.com` to be the primary domain these days, and the public API is only on `api.fxtwitter.com`.

`pxtwitter.com` was our original domain for the project, bought the day before we launched FixTweet (then known as pxTwitter). I was trying to find something memorable and `px` kinda sounds like "pix" or can mean "pixels" which is fitting as a service that can embed images, videos, etc. Not long after, I bought `twittpr.com` because it's easier to do sed replacement with on Discord (`s/e/p`), and because it had a `p` in it, it was sorta related to pxTwitter. They have always functioned identically.

A couple weeks later, I acquired the `fxtwitter.com` domain from RobinUniverse and alongside this rebranded the project as FixTweet and shifted `fxtwitter.com` to be the primary domain instead of `pxtwitter.com`. Like the addition of `twittpr.com` this domain works identically to the others. I wouldn't go as far as to say `pxtwitter.com` is deprecated, but it certainly is the less preferred domain of the 3.

### How come embedding takes so long / is not working in Telegram?

Telegram's embedding servers sometimes never even send us a request to embed a URL, possibly due to their servers being overloaded. If you have a link that is broken you can try one of FixTweets other domains (`fxtwitter.com`, `pxtwitter.com`, `twittpr.com`) or use [Webpage Bot](https://t.me/WebpageBot) to try to clear the cache of the embed.

### Why doesn't multi-image doesn't work in Telegram?

We've temporarily paused multi-image on Telegram due to issues with its embedding service that can cause images to sometimes not show up at all. ([#15](https://github.com/dangeredwolf/FixTweet/issues/15))

### What if I don't want FixTweet to combine my Tweet's images together with multi-image?

No problem! You can pick any specific photo from a Tweet using Twitter's own URL syntax (`/photo/1` is the first photo of a tweet) and we'll render you the full-resolution original image.

---

**Licensed under the permissive MIT license. Feel free to send a pull request!**

## Things to tackle in the future

- Reliable multi-image in Telegram
- Fix guest token caching
- Discord bot?

## Bugs or issues?

Feel free to [open an issue](https://github.com/dangeredwolf/FixTweet/issues), or [ping me on Twitter and I'll see what I can do](https://twitter.com/dangeredwolf).
