import {notFound, redirect, textResponse} from "./util";
import webhook from "./webhook";

declare global {
	const VERSION: string
}

export interface Env {}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method == "POST")
			return await webhook(request);
		const url: URL = new URL(request.url);
		if (url.pathname === "/")
			return redirect("https://github.com/mini-bomba/github-webhook-proxy");
		if (url.pathname === "/version")
			return textResponse(VERSION);
		if (url.pathname === "/source")
			return redirect(`https://github.com/mini-bomba/github-webhook-proxy/tree/${VERSION}`, true);
		return notFound();
	},
};
