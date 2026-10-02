import { TestValidator } from "@nestia/e2e";
import { PlainFetcher } from "@nestia/fetcher";

/**
 * Verifies response `Set-Cookie` headers preserve their full cookie strings.
 *
 * Locks the fetcher response-header normalization branch for cookie headers.
 * `Set-Cookie` attributes also use semicolons, so splitting on semicolons
 * detaches flags like `HttpOnly` and `Secure` from the cookie that owns them.
 *
 * 1. Return two `Set-Cookie` headers from a custom fetch implementation.
 * 2. Propagate the response through `PlainFetcher`.
 * 3. Assert each cookie remains a full string including its attributes.
 *
 * @evidence contracts/testing.md#behavioral-verification PlainFetcher.propagate preserves two full Set-Cookie header values.
 * @evidence contracts/testing.md#independent-expectations Cookie attributes belong to their complete cookie strings and may not be split at semicolons.
 * @evidence contracts/testing.md#distinguishing-cases Two distinct cookies containing flags and an Expires comma must remain separate full strings.
 * @evidence contracts/testing.md#execution-ownership The test-e2e source entry discovers this test-prefixed export; it directly invokes the operation with local fixtures or supported transport injection and performs no product installation or real network session.
 */

export async function test_fetcher_set_cookie_response_headers(): Promise<void> {
  const first: string =
    "cookie1=qwe123; Path=/; Expires=Fri, 05 Apr 2024 12:31:46 GMT; HttpOnly; Secure; SameSite=Lax";
  const second: string =
    "cookie2=asd123; Path=/; Expires=Fri, 05 Apr 2024 12:31:46 GMT; HttpOnly; Secure; SameSite=Lax";

  const result = await PlainFetcher.propagate(
    {
      host: "https://example.com",
      fetch: async () => {
        const headers: Headers = new Headers();
        headers.append("set-cookie", first);
        headers.append("set-cookie", second);
        return new Response("ok", {
          status: 200,
          headers,
        });
      },
    },
    {
      method: "GET",
      path: "/",
      status: 200,
      request: null,
      response: {
        type: "text/plain",
        encrypted: false,
      },
    },
  );

  TestValidator.equals("set-cookie", result.headers["set-cookie"], [
    first,
    second,
  ]);
}
