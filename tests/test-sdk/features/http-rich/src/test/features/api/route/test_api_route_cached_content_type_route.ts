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
 *
 * @evidence contracts/testing.md#behavioral-verification A cached pre-serialized interceptor response must succeed, retain application/json content type and parse to the literal authored article identity.
 * @evidence contracts/testing.md#independent-expectations The authored interceptor returns JSON text for an article with a fixed UUID; TypedRoute must retain JSON response metadata before the adapter handles that text.
 * @evidence contracts/testing.md#distinguishing-cases This cache-hit path bypasses normal handler serialization. The ordinary route and Observable cases provide adjacent normal response controls.
 * @evidence contracts/testing.md#execution-ownership The matching file/export is discovered by the SDK shared HTTP entry. It consumes emitted client artifacts or actual HTTP responses; the case starts no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The native producer, generated client where used, authored controller and live adapter must agree on request and response semantics. Direct rule or generator units do not establish that runtime connection.
 * @evidence contracts/e2e.md#shared-execution All 18 scenarios share one input configuration, one generated SDK, one consumer program and one application. This case adds only its original assertions to that prepared population.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Distinct scenario routes select their own authored controllers; payloads and responses are case-local. The duplicated scenario intentionally reads one immutable module value. The runner closes the application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All assertions from route/src/test/features/api/test_api_route_cached_content_type.ts survive; only imports, discoverable case identity and the explicitly authored scenario route prefix change. Controller and DTO behavior remains unchanged.
 */
export const test_api_route_cached_content_type_route = async (
  connection: api.IConnection,
): Promise<void> => {
  const response: Response = await fetch(
    `${connection.host}/http_rich/route/route/cached`,
  );
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
