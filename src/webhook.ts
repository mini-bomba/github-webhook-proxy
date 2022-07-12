import { fetchResponse, textResponse } from "./util";
import { ReleaseEvent } from "@octokit/webhooks-types";

const webhook_regex = /^\/(\d+)\/([\w-_]+)\/?(?:github)?$/;

export default async function webhook(request: Request): Promise<Response> {
    const url: URL = new URL(request.url);
    const [_, channel_id, webhook_token] = webhook_regex.exec(url.pathname) ?? [];
    if (channel_id == null || webhook_token == null) // Check for valid URL
        return textResponse("Invalid discord webhook ID/token", 401);

    const webhook_url = `https://discord.com/api/webhooks/${channel_id}/${webhook_token}`;
    const event_name = request.headers.get("X-GitHub-Event");
    if (event_name !== "release") // Not a release event -> forward to discord
        return await fetchResponse(`${webhook_url}/github`, request);

    let event: ReleaseEvent;
    try {
        event = await request.json();
    } catch (e) {
        let message = "";
        if (typeof e === "string") {
            message = e;
        } else if (e instanceof Error) {
            message = e.message;
        }
        return textResponse(`Error while parsing input JSON: ${message}`, 400);
    }

    if (event.action !== "published") // Not published -> forward to discord
        return await fetchResponse(`${webhook_url}/github`, {
            method: "POST",
            headers: request.headers,
            body: JSON.stringify(event),
        });

    // release published -> create new embed with more data
    return await fetchResponse(webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json;charset=UTF-8" },
        body: JSON.stringify({
            username: "GitHub",
            avatar_url: "https://cdn.discordapp.com/attachments/743515515799994489/996513463650226327/unknown.png",
            embeds: [{
                author: {
                    name: event.release.author.login,
                    url: event.release.author.html_url,
                    icon_url: event.release.author.avatar_url,
                },
                title: `[${event.repository.full_name}] New release published: ${event.release.name ?? event.release.tag_name}`,
                url: event.release.html_url,
                timestamp: event.release.published_at,
                description: event.release.body?.substring(0, 4096) ?? "",
                color: Number(url.searchParams.get("color")),
            }],
        }),
    });
}