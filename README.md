# pxTwitter

[![Webpack](https://github.com/dangeredwolf/pxtwitter/actions/workflows/webpack.yml/badge.svg)](https://github.com/dangeredwolf/pxtwitter/actions/workflows/webpack.yml)

## A TwitFix-like solution written in TypeScript for Cloudflare Workers.

### Embed videos, polls, and more on Discord, Telegram, and more! Just add `px` before `twitter` to make `pxtwitter.com`

### ... Or on Discord, send a normal Twitter link and type `s/e/p` to replace the domain with `twittpr.com`.

![https://cdn.discordapp.com/attachments/165560751363325952/997386462343462972/pxtwitter.png](https://cdn.discordapp.com/attachments/165560751363325952/997386462343462972/pxtwitter.png)

✅ Embed Videos (Twitter videos, and compatible external providers, such as YouTube)

✅ Embed Poll results

✅ Embed Quote tweets (Including their media, if it doesn't conflict with the linked tweet)

✅ Replace embedded t.co links with originals

✅ Creates media/profile picture color-matching theme-color (looks great on Discord!)

✅ Private: We don't save tweets or their media (Outside of Cloudflare caching for speed)

Here's a little chart comparing features to Twitter default embeds and other embedding services

|                                     | pxTwitter          | Twitter default    | vxTwitter                        | Twxtter                           |
|-------------------------------------|:------------------:|:------------------:|:--------------------------------:|:---------------------------------:|
| Embed Tweets / Photos               | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark:               | :heavy_check_mark:                |
| Embed Videos                        | :heavy_check_mark: | :x:¹               | :heavy_check_mark:               | :heavy_check_mark:                |
| Embed Poll results                  | :heavy_check_mark: | :x:                | :x:                              | :x:                               |
| Embed Quote Tweets                  | :heavy_check_mark: | :x:                | :heavy_minus_sign: Without Media | :heavy_minus_sign: Without Media  |
| Embed Multiple Images               | :x:                | On Discord         | With c.vxtwitter.com             | :x:                               |
| Publicly accessible embed index     | :x:²               | N/A                | :x:²                             | :heavy_check_mark:                |
| Replace t.co with original links    | :heavy_check_mark: | :x:                | :x:                              | :x:                               |
| Media-based embed colors on Discord | :heavy_check_mark: | :x:                | :x:                              | :x:                               |

¹ Discord will attempt to embed Twitter's video player, but it is unreliable

² pxTwitter and vxTwitter both ensure link privacy from the public. vxTwitter still stores all responses in a database / JSON file controlled by the owner. pxTwitter by contrast relies on Cloudflare caching of responses: there is no link store accessible to the owner

Licensed under the permissive MIT license. Feel free to send a pull request!

### Things to tackle in the future

- Combining multiple images together (would be outside CF Worker)
- Caching guest token (So we don't have to bother Twitter for one on every request)

### Bugs or issues?

Feel free to [open an issue](https://github.com/dangeredwolf/pxTwitter/issues), or [ping me on Twitter and I'll see what I can do](https://twitter.com/dangeredwolf).
