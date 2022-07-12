import {notFound, redirect, textResponse} from "./util";
import webhook from "./webhook";


export interface Env {
	VERSION: string
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method == "POST")
			return await webhook(request);
		const url: URL = new URL(request.url);
		if (url.pathname === "/")
			return redirect("https://github.com/mini-bomba/github-webhook-proxy");
		if (url.pathname === "/version")
			return textResponse(env.VERSION);
		if (url.pathname === "/source")
			return redirect(`https://github.com/mini-bomba/github-webhook-proxy/tree/${env.VERSION}`, true);
		return notFound();
	},
};
