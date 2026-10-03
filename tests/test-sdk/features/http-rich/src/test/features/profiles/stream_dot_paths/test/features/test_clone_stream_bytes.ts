import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import api from "../../api";

/**
 * Verifies binary response content types generate stream-aware SDK output.
 *
 * Locks the file-response branch requested for image/video style content types.
 * When a controller declares a binary `Content-Type`, the generated Swagger
 * document must describe a binary string, the SDK output type must be a
 * `ReadableStream`, and the fetcher must return `Response.body` instead of
 * decoding the payload as text.
 *
 * 1. Call the generated SDK with the original authored `image/png` fetch response.
 * 2. Read the returned stream and assert the response bytes are preserved.
 * 3. Assert a bodyless binary response becomes an empty stream, not `null`.
 * 4. Assert generated Swagger describes binary data; the typed assignment checks
 *    the generated SDK return contract during consumer compilation.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated stream SDK retains its typed ReadableStream return, original authored binary-fetch bytes and bodyless-response twin, and emitted Swagger binary schema.
 * @evidence contracts/testing.md#independent-expectations Literal bytes1,2,3,4 and the empty Response establish independent fetch results; OpenAPI binary strings and the generated typed assignment establish the output contracts.
 * @evidence contracts/testing.md#distinguishing-cases Nonempty stream and bodyless binary response distinguish stream decoding from text/null; generated Swagger and consumer typing retain their separate assertions.
 * @evidence contracts/testing.md#execution-ownership This matching shared consumer file/export retains actual native controller generation, current emitted SDK and consumer compilation before execution; the canonical SDK integration discovers its original operations and private helpers.
 * @evidence contracts/e2e.md#necessary-boundary Native binary-response metadata, generated SDK return type and installed fetcher stream decoding must agree; the original boundary supplies an authored fetch, not a product listener.
 * @evidence contracts/e2e.md#shared-execution Both original owners have identical generation options and share one combined graph, default producer, installation and consumer compilation. The original authored fetch remains local to this case and starts no extra server.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route/declaration identities separate the two graphs; local authored response streams or connection handles retain their original lifetime. Fastify uses an OS-assigned port and closes in finally; shared Express belongs to runner teardown.
 * @evidence contracts/e2e.md#preserved-coverage Entire original inputs, assertion/helper bodies and imports remain after private identity and artifact-address rebasing. The complete original wrapper fetch expression is bound locally without changing its bytes or response construction. Original simulate:true generation remains, without forcing transport cases into simulated execution.
 */
export const test_clone_stream_bytes = async (
  connection: api.IConnection,
): Promise<void> => {
  connection = {
    host: "http://127.0.0.1",
    fetch: async () =>
      new Response(
        new ReadableStream<Uint8Array<ArrayBufferLike>>({
          start: (controller) => {
            controller.enqueue(new Uint8Array([1, 2, 3, 4]));
            controller.close();
          },
        }),
        {
          headers: {
            "Content-Type": "image/png",
          },
          status: 200,
        },
      ),
  };
  const output: ReadableStream<Uint8Array<ArrayBufferLike>> =
    await api.functional.http_rich.options.stream_dot_paths.stream.image(
      connection,
    );
  const bytes: number[] = await read(output);
  TestValidator.equals("stream bytes", bytes, [1, 2, 3, 4]);

  const empty: ReadableStream<Uint8Array<ArrayBufferLike>> =
    await api.functional.http_rich.options.stream_dot_paths.stream.image({
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
    await fs.promises.readFile(
      `${__dirname}/../../../../../../../profiles/stream_dot_paths/swagger.json`,
      "utf8",
    ),
  );
  TestValidator.equals(
    "swagger binary response",
    swagger.paths["/http_rich/options/stream_dot_paths/stream/image"].get
      .responses[200].content["image/png"].schema,
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
