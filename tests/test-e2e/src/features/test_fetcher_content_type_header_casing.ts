import { TestValidator } from "@nestia/e2e";
import { PlainFetcher } from "@nestia/fetcher";

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
