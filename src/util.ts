export const baseResponse = (body?: BodyInit, status: number = 200, headers?: object) => new Response(body, {
    status: status,
    headers: {
        "Cache-Control": "no-store",
        ...headers,
    },
});

export const textResponse = (text: string, status: number = 200) => baseResponse(text, status, {
    "Content-Type": "text/plain",
});

export const redirect = (url: string, temporary: boolean = false) => baseResponse(undefined, temporary ? 302 : 301, {
    Location: url,
});

export const notFound = () => baseResponse(undefined, 404);

export async function fetchResponse(request: Request | string, init?: RequestInit | Request) {
    let response: Response = await fetch(request, init);
    response = new Response(response.body, response);
    response.headers.delete("Strict-Transport-Security");
    response.headers.set("Cache-Control", "no-store");
    return response;
}
