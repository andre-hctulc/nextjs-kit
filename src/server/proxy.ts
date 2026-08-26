import { NextRequest, NextResponse } from "next/server.js";

type RequestWithContext = Request & { context?: any };

type EnhanceRequest = (
    request: RequestWithContext,
) => RequestWithContext | void | Promise<RequestWithContext | void>;

type EnhanceResponse = (
    response: NextResponse,
    request: RequestWithContext,
) => NextResponse | void | Promise<NextResponse | void>;

interface ProxyConfig {
    /**
     * A function that can modify the request initializer (e.g. to add authentication).
     * Add custom context data to the request by setting the `context` property.
     */
    enhanceRequest?: EnhanceRequest;
    /**
     * A function that can modify the response (e.g. to add security headers).
     * Also receives the request as second parameter with `context` property.
     *
     * Use {@link applySecurityHeaders} to add common security headers and remove identifying headers.
     */
    enhanceResponse?: EnhanceResponse;
    methods?: string[];
    rewritePath?: (path: string) => string;
    rewriteUrl?: (url: string) => string;
    fetch?: (request: Request) => Promise<Response>;
    requestInit?: RequestInit;
    responseInit?: ResponseInit;
}

type HandlerParams = {
    params: Promise<{ path: string[] }>;
};
type Handler = (request: NextRequest, params: HandlerParams) => Promise<Response>;

type ProxyHandlers = {
    GET: Handler;
    POST: Handler;
    PUT: Handler;
    DELETE: Handler;
    // Allow other methods like PATCH, OPTIONS, HEAD
    [method: string]: Handler;
};

export type ProxyRouter = (request: NextRequest, params: HandlerParams) => Promise<string> | string;

/**
 * Creates proxy handlers for GET, POST, PUT, DELETE.
 *
 * Use it to implement common or reverse proxying.
 *
 * **Use path variable 'path' in the route to capture the path to be proxied.**
 *
 * @param proxyUrl The base URL of the upstream resource server or a function that returns the base URL based on the request and params.
 * @param config Configuration options.
 *
 * @example
 * // In your Next.js route handler file (e.g., `app/api/proxy/[...path]/route.ts`):
 * const handlers = createProxyHandlers("https://api.example.com", {...});
 * export const { GET, POST, PUT, DELETE } = handlers;
 */
export function createProxyHandlers(
    proxyUrl: string | ProxyRouter,
    {
        rewritePath,
        rewriteUrl,
        enhanceRequest,
        enhanceResponse,
        methods,
        fetch: customFetch,
        requestInit,
        responseInit,
    }: ProxyConfig = {},
): ProxyHandlers {
    async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
        const { path: pathParts } = await params;

        let baseUrl = typeof proxyUrl === "string" ? proxyUrl : await proxyUrl(request, { params });
        if (baseUrl.endsWith("/") && baseUrl.length > 1) {
            baseUrl = baseUrl.slice(0, -1);
        }

        let proxyPath = pathParts.join("/");
        if (rewritePath) {
            proxyPath = rewritePath(proxyPath);
        }
        if (!proxyPath.startsWith("/")) {
            proxyPath = `/${proxyPath}`;
        }

        let url = `${baseUrl}${proxyPath}${request.nextUrl.search}`;
        if (rewriteUrl) {
            url = rewriteUrl(url);
        }

        // Copy request headers except hop-by-hop ones
        const headers: HeadersInit = {};
        request.headers.forEach((value, key) => {
            if (!["host", "connection"].includes(key.toLowerCase())) {
                headers[key] = value;
            }
        });

        // Base init
        let proxyRequest: RequestWithContext = new Request(new URL(url), {
            method: request.method,
            headers,
            body: request.body,
            ...requestInit,
        });

        const enhancedReq = await enhanceRequest?.(proxyRequest);
        if (enhancedReq) {
            proxyRequest = enhancedReq;
        }

        // Proxy request
        const res: Response = await (customFetch ? customFetch(proxyRequest) : fetch(proxyRequest));

        let finalRes = new NextResponse(res.body, {
            status: res.status,
            headers: res.headers,
            ...responseInit,
        });

        // enhance response
        const enhancedRes = await enhanceResponse?.(finalRes, proxyRequest);
        if (enhancedRes) {
            finalRes = enhancedRes;
        }

        return finalRes;
    }

    const handlers: ProxyHandlers = {
        GET: handleProxy,
        POST: handleProxy,
        PUT: handleProxy,
        DELETE: handleProxy,
    };

    if (methods) {
        for (const method of methods) {
            if (!handlers[method]) {
                handlers[method] = handleProxy;
            }
        }
    }

    return handlers;
}

/**
 * Applies common security headers to the response and removes identifying headers.
 */
export const applySecurityHeaders: (res: Response) => void = (res) => {
    // set security headers
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "no-referrer");
    // delete headers that may leak information
    res.headers.delete("Server");
    res.headers.delete("X-Powered-By");
};
