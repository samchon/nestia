import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import api from "@api";

/**
 * Verifies binary response content types generate stream-aware SDK output.
 *
 * Locks the file-response branch requested for image/video style content types.
 * When a controller declares a binary `Content-Type`, the generated Swagger
 * document must describe a binary string, the SDK output type must be a
 * `ReadableStream`, and the fetcher must return `Response.body` instead of
 * decoding the payload as text.
 *
 * 1. Call the generated SDK against the server's `image/png` stream response.
 * 2. Read the returned stream and assert the response bytes are preserved.
 * 3. Assert a bodyless binary response becomes an empty stream, not `null`.
 * 4. Assert generated Swagger describes binary data; the typed assignment checks
 *    the generated SDK return contract during consumer compilation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the generated binary route, reads [1,2,3,4], checks a bodyless custom response becomes an empty stream and checks generated binary Swagger schema.
 * @evidence contracts/testing.md#independent-expectations The controller supplies four literal bytes and image/png; the OpenAPI binary-string representation and typed ReadableStream assignment provide independent output contracts.
 * @evidence contracts/testing.md#distinguishing-cases Nonempty real response and null response body separate binary transport from text decoding and empty-body handling. Consumer compilation checks output type without inspecting generated source text.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under stream-response/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The stream-response fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data. Stream readers release their locks in finally; the custom fetch is confined to the empty-response call.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. Nonempty real response and null response body separate binary transport from text decoding and empty-body handling. Consumer compilation checks output type without inspecting generated source text.
 */
export const test_api_stream_response = async (
  connection: api.IConnection,
): Promise<void> => {
  const output: ReadableStream<Uint8Array<ArrayBufferLike>> =
    await api.functional.stream.image(connection);
  const bytes: number[] = await read(output);
  TestValidator.equals("stream bytes", bytes, [1, 2, 3, 4]);

  const empty: ReadableStream<Uint8Array<ArrayBufferLike>> =
    await api.functional.stream.image({
      ...connection,
      fetch: async () =>
        new Response(null, {
          headers: {
            "Content-Type": "image/png",
          },
          status: 200,
        }),
    });
  TestValidator.equals("empty stream bytes", await read(empty), []);

  const swagger = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../../swagger.json`, "utf8"),
  );
  TestValidator.equals(
    "swagger binary response",
    swagger.paths["/stream/image"].get.responses[200].content["image/png"]
      .schema,
    {
      format: "binary",
      type: "string",
    },
  );
};

const read = async (
  stream: ReadableStream<Uint8Array<ArrayBufferLike>>,
): Promise<number[]> => {
  const reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>> =
    stream.getReader();
  const output: number[] = [];
  try {
    while (true) {
      const next: ReadableStreamReadResult<Uint8Array<ArrayBufferLike>> =
        await reader.read();
      if (next.done === true) break;
      output.push(...next.value);
    }
    return output;
  } finally {
    reader.releaseLock();
  }
};
