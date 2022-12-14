import http from "http";

/**
 * @internal
 */
export function headers_to_object(
    headers: http.IncomingHttpHeaders,
): Record<string, string> {
    const output: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers))
        output[key] = value instanceof Array ? value[0] : value || "";
    return output;
}
