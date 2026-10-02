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
 * @evidence contracts/testing.md#behavioral-verification Fetches the cached route directly and asserts a successful JSON Content-Type plus the known cached article id.
 * @evidence contracts/testing.md#independent-expectations The cache interceptor supplies a literal serialized JSON article; JSON media type and that id are independent authored expectations.
 * @evidence contracts/testing.md#distinguishing-cases A cache hit bypasses the typed interceptor, separating route-level metadata from ordinary handler serialization. The uncached route is covered by test_api_route.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under route/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The route fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. A cache hit bypasses the typed interceptor, separating route-level metadata from ordinary handler serialization. The uncached route is covered by test_api_route.
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
