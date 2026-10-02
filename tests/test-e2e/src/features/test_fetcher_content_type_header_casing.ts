import { TestValidator } from "@nestia/e2e";
import { PlainFetcher } from "@nestia/fetcher";

/**
 * Verifies plainFetcher.fetch replaces a lowercase conflicting connection
 * content type.
 *
 * The route declares application/json, which must own request serialization and
 * its header.
 *
 * 1. Exercise the authored scenario and its controls.
 * 2. Assert a lowercase application/xml connection header must become
 *    application/json on the JSON request.
 *
 * @evidence contracts/testing.md#behavioral-verification PlainFetcher.fetch replaces a lowercase conflicting connection content type.
 * @evidence contracts/testing.md#independent-expectations The route declares application/json, which must own request serialization and its header.
 * @evidence contracts/testing.md#distinguishing-cases A lowercase application/xml connection header must become application/json on the JSON request.
 * @evidence contracts/testing.md#execution-ownership The test-e2e source entry discovers this test-prefixed export; it directly invokes the operation with local fixtures or supported transport injection and performs no product installation or real network session.
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
