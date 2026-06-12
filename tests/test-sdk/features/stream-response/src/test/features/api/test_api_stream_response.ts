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
 * 1. Call the generated SDK function with a custom fetch returning an `image/png`
 *    stream response.
 * 2. Read the returned stream and assert the response bytes are preserved.
 * 3. Assert a bodyless binary response becomes an empty stream, not `null`.
 * 4. Assert generated Swagger and SDK source describe the binary stream shape.
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
  while (true) {
    const next: ReadableStreamReadResult<Uint8Array<ArrayBufferLike>> =
      await reader.read();
    if (next.done === true) break;
    output.push(...next.value);
  }
  return output;
};
