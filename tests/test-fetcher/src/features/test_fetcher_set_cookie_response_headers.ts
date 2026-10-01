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
 * @evidence contracts/testing.md#behavioral-verification It returns two `Set-Cookie` headers from a stub fetch, propagates the response through `PlainFetcher`, and asserts each cookie stays one string with its attributes, which fails when the value is split at semicolons.
 * @evidence contracts/testing.md#independent-expectations The expected strings are the literal cookies written in the test, which HTTP defines as one header value each, not values recomputed by the fetcher.
 * @evidence contracts/testing.md#distinguishing-cases Two cookies with different attributes (`HttpOnly`, `Secure`) separate a split that loses flags from one that keeps them and from one that merges the two cookies.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-fetcher` process discovered by `DynamicExecutor`, and drives the `@nestia/fetcher` operation in-process with a stubbed `connection.fetch`, so no server or socket is involved.
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
