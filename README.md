# Pronouns

[![Webpack](https://github.com/dangeredwolf/pronouns-bot/actions/workflows/webpack.yml/badge.svg)](https://github.com/dangeredwolf/pronouns-bot/actions/workflows/webpack.yml)

### A next-gen Discord bot for managing pronouns, written for Cloudflare Workers for free and low-cost hosting, world-class reliability, infinite scalability, and fast response times around the world.

![The finished prompt](https://cdn.discordapp.com/attachments/165560751363325952/988283919738736650/2022-06-19T232721.978_chrome.png)

It is built for Discord interactions, like slash commands and message components, from the very beginning, so they have an experience that feels like a native part of Discord.

### [Check out the docs of how to use it](https://wlf.is/pronouns)

### [Invite to your server](https://wlf.is/pronouns/invite)

---

This bot began with [cloudflare/worker-typescript-template](https://github.com/cloudflare/worker-typescript-template) as a template, and also took inspiration from [advaith1/activities](https://github.com/advaith1/activities) and [discord/cloudflare-sample-app](https://github.com/discord/cloudflare-sample-app) to figure out how to best set-up and use Discord Interaction APIs.

# Quick Start

Pronouns is a decent bot to use as a basis for your own Cloudflare Workers Discord bot as it contains pretty much everything you'd need from an HTTP router to a command router to per-guild storage management.

Things you need

- A Cloudflare account, set up with Workers
- A Cloudflare Workers KV store (We use the name PRONOUNS_BOT_GUILD_SETTINGS)
- A Discord bot created at https://discord.com/developers

This bot uses [wrangler](https://github.com/cloudflare/wrangler), so you should familiarize yourself with it to learn how to deploy your bot.

Check out [discord/cloudflare-sample-app](https://github.com/discord/cloudflare-sample-app) to learn how to set up your Discord bot for interactions. You'll need to set up your worker to configure interactions.

You'll want to configure the following secrets using wrangler:

`DISCORD_PUBLIC_KEY`

`DISCORD_APPLICATION_ID`

`PRONOUNS_BOT_TOKEN`

`PRONOUNS_BOT_TEST_GUILD_ID`

To register commands, you can enable the `/__register` HTTP endpoint in `src/server.ts` to register your commands initially. It's suggested you disable this endpoint afterward though to prevent third parties from trying to re-run command registration. Once this is done once, you can register commands globally or for your test guild using the `/register_guild` and `/register_global` commands in your test server (specified in `PRONOUNS_BOT_TEST_GUILD_ID`).
