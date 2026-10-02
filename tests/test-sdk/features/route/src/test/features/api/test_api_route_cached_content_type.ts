import api from "@api";

/**
 * Verifies @TypedRoute keeps JSON content type when an outer interceptor
 * returns a pre-serialized cached response.
 *
 * Locks the route-level `Content-Type` metadata used by Nest before the
 * response body reaches the HTTP adapter. Cache-like interceptors can return a
 * serialized string without running the `TypedRouteInterceptor`; without header
 * metadata, Express can infer `text/plain` for that cache hit.
 *
 * 1. Call a `@TypedRoute.Get()` endpoint whose interceptor returns cached JSON
 *    text without invoking the next handler.
 * 2. Inspect the raw HTTP response instead of the generated SDK parser.
 * 3. Assert the response succeeds and keeps an `application/json` object body.
 */
export const test_api_route_cached_content_type = async (
  connection: api.IConnection,
): Promise<void> => {
  const response: Response = await fetch(`${connection.host}/route/cached`);
  const contentType: string = response.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().startsWith("application/json") === false)
    throw new Error(
      `Expected application/json content type, got ${JSON.stringify(contentType)}`,
    );
  if (response.ok === false)
    throw new Error(
      `Expected cached route to succeed, got ${response.status}: ${await response.text()}`,
    );

  const body: unknown = await response.json();
  if (
    typeof body !== "object" ||
    body === null ||
    (body as { id?: unknown }).id !== "00000000-0000-4000-8000-000000000000"
  )
    throw new Error(`Expected cached JSON object, got ${JSON.stringify(body)}`);
};
