# pxTwitter

[![Webpack](https://github.com/dangeredwolf/pxtwitter/actions/workflows/webpack.yml/badge.svg)](https://github.com/dangeredwolf/pxtwitter/actions/workflows/webpack.yml)

## A TwitFix-like solution written in TypeScript for Cloudflare Workers. 

### Embed videos, polls, and more!

![https://cdn.discordapp.com/attachments/165560751363325952/997256615365447680/pxtwitter.png](https://cdn.discordapp.com/attachments/165560751363325952/997256615365447680/pxtwitter.png)

✅ Embed Videos

✅ Embed Polls

✅ Embed Quote tweets (Including their media, if it doesn't conflict with the linked tweet)

✅ Replace embedded t.co links with originals

✅ Creates media/pfp color-matching theme-color (looks great on Discord!)

✅ Private, we don't save tweets requested


### Things to tackle in the future

* Embed profiles! (and maybe more?)
* Combining multiple images together
* Caching responses (I haven't done this yet as this is still being actively worked on!)
* Caching guest token (So we don't have to run to Twitter for a new one every request)