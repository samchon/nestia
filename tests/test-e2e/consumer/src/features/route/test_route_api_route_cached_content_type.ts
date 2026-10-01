import api from "../../api";

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
 * @evidence contracts/testing.md#behavioral-verification Raw cached route must succeed with application/json media type and decode to a nonnull object containing the exact authored UUID.
 * @evidence contracts/testing.md#independent-expectations The authored cache interceptor returns serialized createArticle output and TypedRoute declares a JSON response; the literal UUID and JSON media contract independently establish these selected checks.
 * @evidence contracts/testing.md#distinguishing-cases An outer interceptor bypassing the route stringify interceptor contrasts ordinary handler execution. Only UUID/object/media/success are checked here, not the entire cached article or every header.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual Nest interceptor bypass and Express content-type inference must connect to route metadata; calling the serializer directly cannot prove cached HTTP headers.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_route_api_route_cached_content_type = async (
  connection: api.IConnection,
): Promise<void> => {
  const response: Response = await fetch(
    `${connection.host}/route/route/cached`,
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
