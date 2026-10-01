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
 * 1. Call the generated SDK function against the actual `image/png` HTTP route.
 * 2. Read the returned stream and assert the response bytes are preserved.
 * 3. Assert a bodyless binary response becomes an empty stream, not `null`.
 * 4. Assert generated Swagger and SDK source describe the binary stream shape.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual binary HTTP bytes must equal1/2/3/4, a bodyless custom fetch must yield an empty stream, and final Swagger/source must expose binary string/ReadableStream without StreamableFile import.
 * @evidence contracts/testing.md#independent-expectations Authored image handler returns four explicit bytes and binary content type. The public fetch bodyless-response contract supplies empty stream; handwritten schema/source needles establish generated representation.
 * @evidence contracts/testing.md#distinguishing-cases Nonempty actual transport versus bodyless fetch boundary, final document schema and compile-visible stream signature retain distinct witnesses.
 * @evidence contracts/testing.md#execution-ownership The feature executor discovers and awaits test_api_stream_response after generation/emission. The simulate expression arrows return their assertion promises, so asynchronous rejection belongs to the report; zero discovery and any failed case fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Native binary metadata, printed SDK/Swagger, installed fetcher and actual HTTP stream must connect. A custom bodyless Response separately exercises the injected fetch interface; it is not a substitute for the real four-byte request.
 * @evidence contracts/e2e.md#shared-execution This case reuses packed dependencies, its compatible producer and emitted runtime, and its feature binary-response backend rather than compiling per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each reader is canceled and its lock released in nested finally, including read failure. The custom bodyless connection is local; the entry closes the backend and the harness removes only its owned outputs.
 * @evidence contracts/e2e.md#preserved-coverage The test_api_stream_response selected inputs and output/status/document constraints above remain executable after shared preparation. Source-extension now also pins both literal payloads, and HEAD pins its void result; no retained invalid control is replaced by compilation success.
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

  const source: string = await fs.promises.readFile(
    `${__dirname}/../../../api/functional/stream/index.ts`,
    "utf8",
  );
  TestValidator.predicate("sdk stream output", () =>
    source.includes(
      "export type Output = ReadableStream<Uint8Array<ArrayBufferLike>>;",
    ),
  );
  TestValidator.predicate(
    "sdk avoids controller return import",
    () => source.includes("StreamableFile") === false,
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
    try {
      await reader.cancel();
    } finally {
      reader.releaseLock();
    }
  }
};
