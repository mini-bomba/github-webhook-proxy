import {fetchResponse, textResponse} from "./util";
import {ReleaseEvent} from "@octokit/webhooks-types";

const webhook_regex = /^\/\d+\/[\w-_]+$/

export default async function webhook(request: Request): Promise<Response> {
    const url: URL = new URL(request.url);
    if (!webhook_regex.test(url.pathname)) // Check for valid URL
        return textResponse("Invalid discord webhook ID/token", 401);

    const forwardRequest = new Request(`https://discord.com/api/webhooks/${url.pathname.substring(1)}/github`, request) // must clone ahead of time to avoid weird errors
    const event_name = request.headers.get("X-GitHub-Event");
    if (event_name !== "release") // Not a release event -> forward to discord
        return await fetchResponse(forwardRequest);

    let event: ReleaseEvent
    try {
        event = await forwardRequest.json()
    } catch (e) {
        let message = "";
        if (typeof e === "string") {
            message = e;
        } else if (e instanceof Error) {
            message = e.message;
        }
        return textResponse(`Error while parsing input JSON: ${message}`, 400)
    }

    if (event.action !== "published") // Not published -> forward to discord
        return await fetchResponse(`https://discord.com/api/webhooks/${url.pathname.substring(1)}/github`,
            new Request(request, { // cursed, but required to avoid error related with reading the body twice
                "body": JSON.stringify(event)
            })
        );

    return await fetchResponse(`https://discord.com/api/webhooks/${url.pathname.substring(1)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json;charset=UTF-8" },
        body: JSON.stringify({
            username: "GitHub",
            avatar_url: "https://cdn.discordapp.com/attachments/743515515799994489/996513463650226327/unknown.png",
            embeds: [{
                author: {
                    name: event.release.author.login,
                    url: event.release.author.html_url,
                    icon_url: event.release.author.avatar_url
                },
                title: `[${event.repository.full_name}] New release published: ${event.release.name ?? event.release.tag_name}`,
                url: event.release.html_url,
                timestamp: event.release.published_at,
                description: event.release.body?.substring(0, 4096) ?? "",
                color: Number(url.searchParams.get("color"))
            }]
        })
    })
}