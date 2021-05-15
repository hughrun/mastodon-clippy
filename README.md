# mastodon-clippy
A customisable nodejs clippy bot for mastodon.

`mastodon-clippy` notices when you are tooting about a topic that is bad for your health, and gently suggests you stop.

See an example in action at [auspol_clippy](https://ausglam.space/@auspol_clippy).

## configuration

`mastodon-clippy` takes all configuration as ENV variables:

* `CLIPPY_TOPIC` is the topic your clippy bot makes suggestions for. e.g. "auspol".
* `CLIPPY_DOMAIN` is the base domain for the Mastodon server your bot runs on _without a protocol_. e.g. "botsin.space"
* `CLIPPY_USER` is the username of the bot, e.g. "auspol_clippy".
* `CLIPPY_ACCESS_TOKEN` is the API access token for your bot.

## auto-config

Some settings for your bot account will be automatically set/overridden whenever the bot starts. These are:

```json
locked: false,
bot: true,
discoverable: true,
source: { privacy: 'private' }
```
That is, your bot must always:

* accept new followers
* declare it is a bot
* be discoverable on the server suggestions page
* post messages in "followers only" mode

## manual config

It does not appear to be possible to use the API to set accounts to hide their social graph. users should be able to use your bot without other people necessarily knowing, but the bot needs to follow them in order to work. Therefore you should manually select `Hide your network` in `https://example.com/settings/preferences/other`.

## setup

You can use the example systemd file at `mastodon-clippy.service.example` tweaked to suit your setup. This will keep the bot running and set your environment variables as above.

# running

Start the bot with the traditional `node index.js`.

## interacting with the bot

To "sign up" for notification from your bot, users have two options:

1. follow the bot account
2. send a toot to the bot with the word `START` in capital letters. e.g. `@auspol_clippy START`

To "unsubscribe" from the bot, users can send a toot with the word `STOP` in capital letters. e.g. `@auspol_clippy STOP`