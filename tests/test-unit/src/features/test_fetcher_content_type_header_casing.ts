import { TestValidator } from "@nestia/e2e";
import { PlainFetcher } from "@nestia/fetcher";

/**
 * Verifies a connection-level `content-type` header in any casing is replaced
 * by the route's own content type.
 *
 * 1. Send a POST through `PlainFetcher` with a lower-case `content-type:
 *    application/xml` header in the connection.
 * 2. Assert the recorded request carries `application/json`.
 *
 * @evidence contracts/testing.md#behavioral-verification It sends a request through `PlainFetcher.fetch()` with a lower-case `content-type` in the connection and asserts the header of the recorded request, which detects a fetcher that only replaces the exact spelling `Content-Type` and sends both.
 * @evidence contracts/testing.md#independent-expectations The expected value is the route's declared JSON content type, which the SDK contract gives; it is not read back from the fetcher's own code.
 * @evidence contracts/testing.md#distinguishing-cases The lower-case spelling with a conflicting value is the adjacent input to the canonical spelling; other casings and multipart are owned by `test_fetcher_multipart_content_type`.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process discovered by `DynamicExecutor`, and drives the `@nestia/fetcher` operation in-process with a stubbed `connection.fetch`, so no server or socket is involved.
 */
export async function test_fetcher_content_type_header_casing(): Promise<void> {
  let captured: string | null = null;
  await PlainFetcher.fetch(
    {
      host: "https://example.com",
      headers: { "content-type": "application/xml" },
      fetch: async (_input, init) => {
        captured = new Headers(init?.headers).get("content-type");
        return new Response("null", {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
    {
      method: "POST",
      path: "/content-type",
      status: 200,
      request: { type: "application/json", encrypted: false },
      response: { type: "application/json", encrypted: false },
    },
    { value: true },
  );
  TestValidator.equals<string | null>(
    "content type",
    captured,
    "application/json",
  );
}
