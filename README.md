# github-webhook-proxy
A WebWorker that proxies webhook payloads between GitHub and Discord,
adding extra data for some events.

Public instance available at https://github-webhook-proxy.minibomba.workers.dev

## Routes
```
POST /{channel ID}/{webhook token} - Execute webhook
POST /{channel ID}/{webhook token}?color={color}
channel ID and webhook token should be taken from a discord webhook URL
color specifies embed color for the release created event

/ - Redirects to this repository
/version - Sends currently deployed git hash
/source - Redirects to a view of the currently deployed commit
```

## How to use
Grab a discord webhook URL and replace `https://discord.com/api/webhooks` with `https://github-webhook-proxy.minibomba.workers.dev` (or your own instance URL)

## Why
Discord doesn't put release descriptions from GitHub webhook payloads into embeds, this exists to fix that.

It currently only modifies release created events.