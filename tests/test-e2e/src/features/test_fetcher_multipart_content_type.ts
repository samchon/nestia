import { TestValidator } from "@nestia/e2e";
import { PlainFetcher } from "@nestia/fetcher";
import { EncryptedFetcher } from "@nestia/fetcher/lib/EncryptedFetcher";

/**
 * Verifies a request always carries its route's own content type, never one the
 * caller put in `connection.headers`, and a multipart request none at all.
 *
 * `FetcherBase` replaced a connection-level `Content-Type` for every request
 * type but `multipart/form-data`, which it left alone so that `fetch` could
 * write the boundary. A caller's `Content-Type: application/json` then went out
 * on the multipart request, `fetch` did not replace it, and the server received
 * a multipart body labeled JSON with no boundary (#1707).
 *
 * 1. Send a multipart request through `PlainFetcher` and `EncryptedFetcher` with a
 *    connection-level `Content-Type`, in two casings, and assert the recorded
 *    request carries `multipart/form-data` with a boundary.
 * 2. Assert a JSON and a body-less request carry their own content type, or none,
 *    as before.
 */
export async function test_fetcher_multipart_content_type(): Promise<void> {
  const send = async (props: {
    fetcher: typeof PlainFetcher | typeof EncryptedFetcher;
    header: string;
    type: "multipart/form-data" | "application/json" | undefined;
    input: unknown;
  }): Promise<string | null> => {
    let captured: string | null = "unset";
    await props.fetcher.fetch(
      {
        host: "https://example.com",
        headers: { [props.header]: "application/json", authorization: "t" },
        encryption: { key: "A".repeat(32), iv: "B".repeat(16) },
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
          // a Request lets fetch compute the header from the body, as the
          // network layer does
          captured = new Request(input, init).headers.get("content-type");
          return new Response("null", {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        },
      },
      {
        method: "POST",
        path: "/upload",
        status: 200,
        request:
          props.type === undefined
            ? null
            : { type: props.type, encrypted: false },
        response: { type: "application/json", encrypted: false },
      },
      props.input,
    );
    return captured;
  };
  for (const fetcher of [PlainFetcher, EncryptedFetcher])
    for (const header of ["Content-Type", "content-type"]) {
      const multipart: string | null = await send({
        fetcher,
        header,
        type: "multipart/form-data",
        input: { title: "hello" },
      });
      TestValidator.predicate(
        `${header}: multipart boundary`,
        multipart !== null &&
          multipart.startsWith("multipart/form-data; boundary="),
      );
      TestValidator.equals(
        `${header}: json`,
        await send({
          fetcher,
          header,
          type: "application/json",
          input: { title: "hello" },
        }),
        "application/json",
      );
      TestValidator.equals(
        `${header}: no body`,
        await send({ fetcher, header, type: undefined, input: undefined }),
        null,
      );
    }
}
