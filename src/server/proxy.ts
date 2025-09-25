import { NextRequest, NextResponse } from "next/server.js";

type EnhancedRequest = Request & { context?: any };

type EnhanceRequest = (
    request: NextRequest & { context?: any }
) => EnhancedRequest | void | Promise<EnhancedRequest | void>;

type EnhanceResponse = (
    response: NextResponse,
    request: Request & { context?: any }
) => Response | void | Promise<Response | void>;

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
}

type Handler = (request: NextRequest, params: { params: { path: string[] } }) => Promise<Response>;

type ProxyHandlers = {
    GET: Handler;
    POST: Handler;
    PUT: Handler;
    DELETE: Handler;
    // Allow other methods like PATCH, OPTIONS, HEAD
    [method: string]: Handler;
};
/**
 * Creates proxy handlers for GET, POST, PUT, DELETE.
 *
 * Use it to implement common or reverse proxying.
 *
 * @param proxyUrl The base URL of the upstream resource server.
 * @param config Configuration options.
 */
export function createProxyHandlers(proxyUrl: string, config: ProxyConfig = {}): ProxyHandlers {
    async function handleProxy(request: NextRequest, { params }: { params: { path: string[] } }) {
        // Build target URL
        let path = params.path.join("/");
        if (config.rewritePath) {
            path = config.rewritePath(path);
        }
        if (!path.startsWith("/")) path = `/${path}`;

        const url = `${proxyUrl}${path}${request.nextUrl.search}`;

        // Copy request headers except hop-by-hop ones
        const headers: HeadersInit = {};
        request.headers.forEach((value, key) => {
            if (!["host", "connection"].includes(key.toLowerCase())) {
                headers[key] = value;
            }
        });

        // Base init
        let proxyRequest: Request = new NextRequest(new URL(url), {
            method: request.method,
            headers,
            body: request.body,
        });

        const enhancedReq = await config.enhanceRequest?.(proxyRequest as NextRequest);
        if (enhancedReq) {
            proxyRequest = enhancedReq;
        }

        // Proxy request
        const res = await fetch(proxyRequest);

        let finalRes: Response = new NextResponse(res.body, { status: res.status, headers: res.headers });

        // enhance response
        const enhancedRes = await config.enhanceResponse?.(finalRes as NextResponse, proxyRequest);
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

    if (config.methods) {
        for (const method of config.methods) {
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
