# FixTweet / FixupX <img src="https://abs-0.twimg.com/emoji/v2/svg/1f527.svg" height="28">

## Embed X / Twitter videos, polls, translations, & more on Discord, Telegram, and others!

![][icons]

[![esbuild][buildbadge]][build]
[![Tests][testsbadge]][tests]
[![Status][statusbadge]][status]
[![License][licensebadge]][license]

<!-- Links & Badges -->

[icons]: https://skillicons.dev/icons?i=typescript,workers
[build]: https://github.com/FixTweet/FixTweet/actions/workflows/build.yml
[buildbadge]: https://github.com/FixTweet/FixTweet/actions/workflows/build.yml/badge.svg
[tests]: https://github.com/FixTweet/FixTweet/actions/workflows/tests.yml
[testsbadge]: https://github.com/FixTweet/FixTweet/actions/workflows/tests.yml/badge.svg
[license]: https://github.com/FixTweet/FixTweet/blob/main/LICENSE.md
[licensebadge]: https://img.shields.io/github/license/FixTweet/FixTweet
[status]: https://status.fxtwitter.com
[statusbadge]: https://status.fxtwitter.com/api/badge/8/uptime/720?label=Uptime%2030d

## Written in TypeScript as a Cloudflare Worker to scale, packed with more features and [best-in-class user privacy 🔒](#built-with-privacy-in-mind).

### Add `fx` before your `twitter.com` link to make it `fxtwitter.com`

### OR: Add `fixup` before your `x.com` link to make it `fixupx.com`

### For `twitter.com` links on Discord, send a link and type `s/e/p` to make `twittpr.com`.

<img src="https://cdn.discordapp.com/attachments/165560751363325952/1006346785985417307/fixtweet.webp">

## Embed Videos

We all have videos of memes and other things from Twitter we want to quickly share with friends. With normal Twitter links, embedding videos is often broken on Discord and impossible on Telegram. But using FixTweet, we embed the raw mp4 file so it's compatible with just about anything supporting video embeds.

![](https://cdn.discordapp.com/attachments/165560751363325952/1184627562811494461/video.png)

On Discord, we'll also automatically embed videos linked from other platforms, such as YouTube, so they can play without having to open a browser.

## Embed Polls

If you want to share the results of a Twitter poll, you can do so by just linking the post using FixTweet.

![](https://cdn.discordapp.com/attachments/165560751363325952/1006331192372629544/FixTweet.png)

## Embed Quotes & Media

Quotes and their media can provide important context to a post. So we'll automatically add said context, and even media if there isn't already media embedded in the quote.

![](https://cdn.discordapp.com/attachments/165560751363325952/1184630052797816863/quote.png)

## Translate Posts

You can translate a post into any other supported language, with the original and translated text displayed as space allows.

Just append a post with its 2-letter ISO language code. So for English, add `/en` at the end.

![](https://cdn.discordapp.com/attachments/165560751363325952/1184625715522572298/translation.png)

## Gallery view

Use `g.fxtwitter.com` or `g.fixupx.com` to generate minimal embeds with just the post's media and author information without other distractions. This can be particularly useful for read-only channels dedicated to sharing media.

![](https://cdn.discordapp.com/attachments/165560751363325952/1182788212482117662/gallery.png)

## Direct media links

Want to link directly to a post's media without the embed? You can easily do that using FixTweet.

![Image demonstrating the feature](https://cdn.discordapp.com/attachments/165560751363325952/1006338772192989194/FixTweet.png)

There are a few supported ways to do this:

- Add `d.` before the domain (so, `d.fxtwitter.com`)
- Add `.mp4` to the end of videos or `.jpg` to the end of images, after the post ID

## Telegram Instant View

View the full contents of tweets without leaving Telegram or opening a browser! We automatically enable instant view in these cases:

- The domain is i.fxtwitter.com / i.fixupx.com
- The post contains photos, translations, or is over 280 characters

In the future we plan to do even more with Instant View such as embedding entire threads.

Examples from above:

- `https://d.fxtwitter.com/dangeredwolf/status/1548119328498728960`
- `https://fxtwitter.com/dangeredwolf/status/1548117889437208581.jpg`

Posts with multiple images are supported, so you can do something like this and it will pick the correct one:

`https://d.fxtwitter.com/dangeredwolf/status/1547514042146865153/photo/3`

Otherwise, it will default to the first image.

## Replace t.co shorteners with original link

The default Twitter embeds include t.co link shorteners, which make it difficult to know where the link is heading. We automatically replace t.co links with their original links to make things clearer.

![](https://cdn.discordapp.com/attachments/165560751363325952/1006348698659344464/FixTweet.png)

## Redirect to Nitter or other custom instances

If you want to redirect to Nitter or another custom Twitter interface, you can set your custom redirect domain, like so: `https://fxtwitter.com/set_base_redirect?url=https://nitter.net`

At this time, the cookie is only set on the domain you set it on, so if you set it up using `fxtwitter.com`, `fixupx.com` will not redirect to your custom domain unless you set it there.

## Built with privacy in mind

FixTweet doesn't save logs of what posts you're sending, nor do we have a public record of what posts are being embedded by FixTweet.

In fact, because our core embedding and API service uses Cloudflare Workers, FixTweet can only run when you send it a request. Its memory doesn't stick around, and it doesn't have a file system or database to read from at all. That is how we keep our privacy promise by building it into the architecture. We use Cloudflare Analytics Engine to aggregate basic, anonymous statistics, which do not include information that could identify individual users or posts. My goal is always to provide a good public service, and FixTweet doesn't have any ads or tracking to make money off of, nor do we sell data.

Note: We use Cloudflare to cache FixTweet responses to make repeat access faster, which have a maximum TTL of 1 hour. Temporary real-time logging in the terminal (specifically `wrangler tail`) may be used only by the developer while the Worker is being serviced or debugged (to make sure things work as they should), however these logs are only shown in the terminal and are never saved or used for any other purpose. URLs that cause runtime errors in the script (aka Exceptions, usually exceedingly rare unless there was a faulty update pushed out or Twitter API is down) may be logged for a developer to diagnose the issue that is preventing your embed from working.

On a different note, if the person who posted a FixTweet link forgot to strip tracking parameters (like `?s` and `&t`), we strip it upon redirecting to the post as they are only used for Twitter telemetry and advertising.

---

## Why use FixTweet?

In many ways, FixTweet has richer embeds and does more. Here's a table comparing some of FixTweet's features compared to Twitter default embeds as well as other embedding services

|                                        |                      FixTweet                      |         Twitter default          |              vxTwitter (BetterTwitFix)              |
| -------------------------------------- | :------------------------------------------------: | :------------------------------: | :-------------------------------------------------: |
| Embed Posts / Images                   |                 :heavy_check_mark:                 |        :heavy_check_mark:        |                 :heavy_check_mark:                  |
| Embed profile pictures on text posts   |                 :heavy_check_mark:                 |               :x:                |                 :heavy_check_mark:                  |
| Embed Twitter Videos                   |                 :heavy_check_mark:                 | :heavy_minus_sign: Discord Only¹ |                 :heavy_check_mark:                  |
| Embed External Videos (YouTube, etc.)  |                :heavy_check_mark:⁴                 |               :x:                |                        :x:³                         |
| Embed Poll results                     |                 :heavy_check_mark:                 |               :x:                |            [:heavy_check_mark:][polladd]            |
| Embed Quotes                           |                 :heavy_check_mark:                 |               :x:                |        :ballot_box_with_check: Without Media        |
| Embed Multiple Images                  |                 :heavy_check_mark:                 | :heavy_minus_sign: Discord Only² |                 :heavy_check_mark:                  |
| Translate Posts                        |                 :heavy_check_mark:                 |               :x:                |                         :x:                         |
| Replace t.co with original links       |                 :heavy_check_mark:                 |               :x:                |                 :heavy_check_mark:                  |
| Redirect to media file (without embed) |                 :heavy_check_mark:                 |               :x:                | :ballot_box_with_check: Subdomain broken, no images |
| Gallery view                           |                 :heavy_check_mark:                 |               :x:                |                         :x:                         |
| Strip tracking info on redirect        |                 :heavy_check_mark:                 |               :x:                |                 :heavy_check_mark:                  |
| Show retweet, like, reply, view counts | :heavy_minus_sign: Discord / Telegram Instant View | :heavy_minus_sign: Discord Only² |     :ballot_box_with_check: No replies / views      |
| Discord sed replace (`s/`) friendly    |        :ballot_box_with_check: twittpr.com         |               N/A                |                         :x:                         |
| Domain for X.com links                 |         :ballot_box_with_check: fixupx.com         |               N/A                |          :ballot_box_with_check: fixvx.com          |
| Telegram Instant View                  |                 :heavy_check_mark:                 |               :x:                |                         :x:                         |
| Status fetch API for Developers        |                 :heavy_check_mark:                 |               N/A                |                 :heavy_check_mark:                  |
| Last commit                            |                   [![][flc]][fc]                   |               N/A                |                   [![][vlc]][vc]                    |

[flc]: https://img.shields.io/github/last-commit/FixTweet/FixTweet?label
[vlc]: https://img.shields.io/github/last-commit/dylanpdx/BetterTwitFix?label
[slc]: https://img.shields.io/github/last-commit/Twxtter/Twxtter-main?label
[fc]: https://github.com/FixTweet/FixTweet/commits
[vc]: https://github.com/dylanpdx/BetterTwitFix/commits
[sc]: https://github.com/Twxtter/Twxtter-main/commits
[polladd]: https://github.com/dylanpdx/BetterTwitFix/issues/17

¹ Discord will attempt to embed Twitter's video player, but it is unreliable and does not work on mobile

² Discord uses a custom embed container for Twitter.com to enable multi-image, which is unfortunately not available to other websites.

³ On GitHub, BetterTwitFix (vxTwitter) claims to support this feature, however in my testing as of December 2023, this does not seem to work.

⁴ External media requiring web containers, such as YouTube, won't embed in Telegram because Telegram doesn't support it. Plain media will work in Telegram, and it works either way inside Discord.

---

## Why FixTweet is nicer to develop for and deploy

FixTweet was originally designed for edge computing in mind meaning it's easy to run closer to your users (which has significant latency advantages for people in a lot of regions). The way we use it and recommend deployment is using Cloudflare Workers, which are completely free for up to 100,000 requests per day, per account. Cloudflare Workers are [fast to set up](https://developers.cloudflare.com/workers/get-started/guide/) and your script is distributed in their datacenters around the world for lower latency. It may be possible to run it on other platforms that support Hono, but at this time we do not provide documentation to do so yet.

FixTweet does not need a database nor a Twitter API key: It takes a similar approach to `youtube-dl` where it pretends to be a logged-out Twitter web user, fetching a guest token and making API requests from there. At one point, this meant "unlimited" read-only access to Twitter's API, including things they don't expose in their public API, useful for polls and other features. It's been locked down pretty heavily after Elon Musk took over Twitter, but the guest token API does still work.

## Deploy FixTweet yourself

ℹ️ Currently, we only provide assistance with deploying with Cloudflare Workers, [but it may be possible to run on other web standards-compliant runtimes](https://hono.dev/getting-started/basic).

Clone the repo, install [Node.js](https://nodejs.org/) and run `npm install` in the repo directory. Copy `wrangler.example.toml` to `wrangler.toml` and add your [Cloudflare account ID](https://developers.cloudflare.com/fundamentals/get-started/basic-tasks/find-account-and-zone-ids/), and change the name of your worker if you need to. Also copy `.env.example` to `.env` and change HOST_URL, DIRECT_MEDIA_DOMAINS to your desired domain and whatever else you need to do. Authenticate with Cloudflare with `npx wrangler login`, then do `npm run deploy` (or `npx wrangler deploy --no-bundle`).

[If you have more questions about setting up Cloudflare Workers, check out their Getting Started guide](https://developers.cloudflare.com/workers/get-started/guide/).

Once you're set up with your worker on `*.workers.dev`, [add your worker to your custom domain](https://developers.cloudflare.com/workers/platform/routing/custom-domains/).

Populate Sentry details in your `.env` to use Sentry in your product to catch exceptions.

In 2023, Twitter began blocking posts with NSFW media from the guest API. We use a service binding code-named [elongator](https://github.com/FixTweet/elongator), which use empty Twitter accounts to make these requests successfully. This is an optional component and is only necessary for those who plan to support embedding NSFW tweets. This method also means you never have to pay Elon Musk to use Twitter's official API.

---

## FAQ

### What's the difference between `fxtwitter.com`, `twittpr.com`, and `fixupx.com`?

They all run the exact same worker and function identically... mostly.

`fxtwitter.com` is the primary domain, with `twittpr.com` as an alternative that allows for quick sed replacement for Twitter links. With `fixupx.com`, you can easily fix `x.com` links as well (Very short .com domains are expensive, sorry I didn't get something shorter)

### How come embedding takes so long / is not working in Telegram?

Telegram's embedding servers sometimes never even send us a request to embed a URL, possibly due to their servers being overloaded. If you have a link that is broken you can try one of FixTweet's other domains (`fxtwitter.com`, `twittpr.com`) or use [Webpage Bot](https://t.me/WebpageBot) to try to clear the cache of the embed.

### Why do video embeds look different on Discord?

Discord hides the text when videos are attached to a website embed. As a result, we have to mess around with other parameters to display embeds correctly.

### What if I don't want FixTweet to combine my post's images together with multi-image?

No problem! You can pick any specific photo from a post using Twitter's own URL syntax (`/photo/1` is the first photo of a post) and we'll render you the full-resolution original image.

---

**Licensed under the permissive MIT license. Feel free to send a pull request!**

## Star History

<a href="https://star-history.com/#FixTweet/FixTweet&Timeline">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=FixTweet/FixTweet&type=Timeline&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=FixTweet/FixTweet&type=Timeline" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=FixTweet/FixTweet&type=Timeline" />
  </picture>
</a>

## Bugs or issues?

Feel free to [open an issue](https://github.com/FixTweet/FixTweet/issues)

## Additional Credits

[Mosaic](https://github.com/FixTweet/mosaic) Multi-image combiner by [Antonio32A](https://github.com/Antonio32A)

& other contributions by [Antonio32A](https://github.com/Antonio32A), [Burner](https://github.com/YaBoiBurner), [Deer-Spangle](https://github.com/Deer-Spangle), [Eramdam](https://github.com/Eramdam), [SirStendec](https://github.com/SirStendec), [SpeedyFolf](https://github.com/SpeedyFolf), [Wazbat](https://github.com/Wazbat)
