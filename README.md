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
Discord's GitHub webhook support isn't great. It doesn't attach release descriptions to messages about them being created, it can't differentiate between a PR getting closed and it getting merged, it doesn't know about the different issue close reasons.
This project was created to mitiage some of these issues.

It currently intercepts and improves the following events:
- release creation
  - adds the release description and timestamp into the message
- issue closing/reopening
  - includes the reason for closing the issue (completed/not planned)
  - adds colors associated with the different close reasons and reopening the issue
- pull requests
  - differentiates between closing and merging the PR
  - sends messages when a PR is marked as draft or ready for review
  - adds colors associated with these actions

## some images i guess
![comparison of issue events](docs/comparison1.png)
![comparison of PR and release events](docs/comparison2.png)
