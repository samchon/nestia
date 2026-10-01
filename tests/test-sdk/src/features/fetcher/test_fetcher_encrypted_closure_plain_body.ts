import { TestValidator } from "@nestia/e2e";
import { AesPkcs5 } from "@nestia/fetcher/lib/AesPkcs5";
import { EncryptedFetcher } from "@nestia/fetcher/lib/EncryptedFetcher";

/**
 * Verifies the encryption password closure receives the serialized plain text
 * when encoding and the cipher text when decoding.
 *
 * The closure's `body` is typed as a string, and the server hands it the plain
 * JSON text for a response and the cipher text for a request. The client passed
 * the caller's raw object when encoding, so a closure reading `body.length` or
 * parsing it misbehaved.
 *
 * 1. Call an encrypted POST route whose password is a closure recording its input,
 *    with a stub fetch that decrypts the wire body and answers an encrypted
 *    one.
 * 2. Assert the encode call received the JSON text, the wire body decrypts to the
 *    same text and the decode call received the cipher text the stub sent.
 * 3. Repeat with a custom `stringify` and with a fixed password object as
 *    controls.
 *
 * @evidence contracts/testing.md#behavioral-verification The recorded closure inputs distinguish a string from an object for the encode direction and the exact cipher text for the decode direction, and the decrypted wire body proves the same text was encrypted.
 * @evidence contracts/testing.md#independent-expectations The expected text is JSON.stringify of the authored input and the cipher text is produced by the test with AesPkcs5 under its own key, so neither comes from the closure wiring.
 * @evidence contracts/testing.md#distinguishing-cases The closure password is the case, a custom stringify checks that the closure sees the text actually encrypted, and a fixed password object is the control without a closure.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared test-sdk process and calls the built fetcher in-process with a stub fetch; no server or network is used.
 */
export async function test_fetcher_encrypted_closure_plain_body(): Promise<void> {
  const key: string = "A".repeat(32);
  const iv: string = "B".repeat(16);
  const answer = (): Response =>
    new Response(AesPkcs5.encrypt(JSON.stringify({ ok: 1 }), key, iv), {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
  const route = {
    method: "POST",
    path: "/items",
    request: { type: "text/plain", encrypted: true },
    response: { type: "text/plain", encrypted: true },
    status: 200,
  } as const;

  for (const [title, stringify, expected] of [
    ["default", undefined, JSON.stringify({ a: 1 })],
    ["custom stringify", () => "custom-text", "custom-text"],
  ] as const) {
    const seen: Array<[string, string, string]> = [];
    const wire: string[] = [];
    const output = await EncryptedFetcher.fetch<{ a: number }, { ok: number }>(
      {
        host: "http://localhost",
        encryption: (props) => {
          seen.push([props.direction, typeof props.body, props.body]);
          return { key, iv };
        },
        fetch: async (_url, init) => {
          wire.push(AesPkcs5.decrypt(String(init?.body), key, iv));
          return answer();
        },
      },
      route as any,
      { a: 1 },
      stringify as any,
    );
    TestValidator.equals(`${title} output`, output, { ok: 1 });
    TestValidator.equals(`${title} wire`, wire, [expected]);
    TestValidator.equals(`${title} encode input`, seen[0], [
      "encode",
      "string",
      expected,
    ]);
    TestValidator.equals(`${title} decode input`, seen[1], [
      "decode",
      "string",
      AesPkcs5.encrypt(JSON.stringify({ ok: 1 }), key, iv),
    ]);
  }

  const fixed = await EncryptedFetcher.fetch<{ a: number }, { ok: number }>(
    {
      host: "http://localhost",
      encryption: { key, iv },
      fetch: async () => answer(),
    },
    route as any,
    { a: 1 },
  );
  TestValidator.equals("fixed password", fixed, { ok: 1 });
}
