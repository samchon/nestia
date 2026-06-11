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
