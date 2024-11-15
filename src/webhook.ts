import { fetchResponse, textResponse } from "./util";
import { IssuesEvent, PullRequestEvent, ReleaseEvent } from "@octokit/webhooks-types";

const webhook_regex = /^\/(\d+)\/([\w-_]+)\/?(?:github)?$/;


async function handleReleaseEvent(request: Request, webhook_url: string): Promise<Response> {
    const url: URL = new URL(request.url);
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

async function handleIssueEvent(request: Request, webhook_url: string): Promise<Response> {
    let event: IssuesEvent;
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
    
    let action: string;
    let color: number;
    switch(event.action) {
        case "reopened":
            action = "reopened";
            color = 0x1f883d;
            break;
        case "closed":
            action = `closed as ${event.issue.state_reason!.replaceAll('_', ' ')}`;
            if (event.issue.state_reason === "not_planned") {
                color = 0x212830;
            } else {
                color = 0x8250df;
            }
            break;
        // some other action type we don't want to modify
        default:
            return await fetchResponse(`${webhook_url}/github`, {
                method: "POST",
                headers: request.headers,
                body: JSON.stringify(event),
            });
    }
    
    return await fetchResponse(webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json;charset=UTF-8" },
        body: JSON.stringify({
            username: "GitHub",
            avatar_url: "https://cdn.discordapp.com/attachments/743515515799994489/996513463650226327/unknown.png",
            embeds: [{
                author: {
                    name: event.sender.login,
                    url: event.sender.html_url,
                    icon_url: event.sender.avatar_url,
                },
                title: `[${event.repository.full_name}] Issue ${action}: #${event.issue.number} ${event.issue.title}`,
                url: event.issue.html_url,
                color,
            }],
        }),
    });
}

async function handlePREvent(request: Request, webhook_url: string): Promise<Response> {
    let event: PullRequestEvent;
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

    let action: string;
    let color: number;
    switch(event.action) {
        case "converted_to_draft":
            action = "converted to draft";
            color = 0x212830;
            break;
        case "ready_for_review":
            action = "ready for review";
            color = 0xf6f8fa;
            break;
        case "reopened":
            action = "reopened";
            color = 0x1f883d;
            break;
        case "closed":
            if (event.pull_request.merged) {
                action = "merged"
                color = 0x8250df;
            } else {
                action = "closed";
                color = 0xcf222e;
            }
            break;
        // some other action type we don't want to modify
        default:
            return await fetchResponse(`${webhook_url}/github`, {
                method: "POST",
                headers: request.headers,
                body: JSON.stringify(event),
            });
    }

    return await fetchResponse(webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json;charset=UTF-8" },
        body: JSON.stringify({
            username: "GitHub",
            avatar_url: "https://cdn.discordapp.com/attachments/743515515799994489/996513463650226327/unknown.png",
            embeds: [{
                author: {
                    name: event.sender.login,
                    url: event.sender.html_url,
                    icon_url: event.sender.avatar_url,
                },
                title: `[${event.repository.full_name}] Pull request ${action}: #${event.pull_request.number} ${event.pull_request.title}`,
                url: event.pull_request.html_url,
                color,
            }],
        }),
    });
}

export default async function webhook(request: Request): Promise<Response> {
    const url: URL = new URL(request.url);
    const [_, channel_id, webhook_token] = webhook_regex.exec(url.pathname) ?? [];
    if (channel_id == null || webhook_token == null) // Check for valid URL
        return textResponse("Invalid discord webhook ID/token", 401);

    const webhook_url = `https://discord.com/api/webhooks/${channel_id}/${webhook_token}`;
    const event_name = request.headers.get("X-GitHub-Event");

    switch(event_name) {
        case "release":
            return await handleReleaseEvent(request, webhook_url);
        case "issues":
            return await handleIssueEvent(request, webhook_url);
        case "pull_request":
            return await handlePREvent(request, webhook_url);
        default:
            return await fetchResponse(`${webhook_url}/github`, request);
    }
}
