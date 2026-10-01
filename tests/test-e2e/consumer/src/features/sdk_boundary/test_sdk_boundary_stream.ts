import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

import api from "../../api";

/**
 * Verifies binary and null-body SDK responses yield the supported stream.
 *
 * A successful status with no body must still return a readable empty stream,
 * distinct from the real nonempty transport.
 *
 * 1. Read four authored bytes through the generated HTTP request.
 * 2. Use the public fetch injection for a null-body Response and read its empty
 *    stream.
 * 3. Check the actual binary Swagger schema and generated stream signature.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual bytes equal1/2/3/4 and null-body Response yields an empty stream; Swagger exposes binary string and the generated signature avoids StreamableFile.
 * @evidence contracts/testing.md#independent-expectations The handler returns four literal bytes with image/png; Response(null) has no payload and the public fetcher stream contract exposes an empty ReadableStream.
 * @evidence contracts/testing.md#distinguishing-cases Nonempty real HTTP and empty injected-response boundary contrast null payload handling; actual output signature/schema retain generator controls.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer discovers this one matching named export and awaits its actual connection/artifact assertions after the single consumer compilation.
 * @evidence contracts/e2e.md#necessary-boundary Installed native stream metadata, generator, emitted SDK and fetcher must connect to the actual HTTP bytes; fetch injection supplements that connection.
 * @evidence contracts/e2e.md#shared-execution One packed installation, producer, generated consumer and backend supply these observations; no additional compiler or host is created.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity SDK boundary routes and type names isolate these stateless specimens. Reads concern only the current sandbox artifacts and every acquired response/reader is consumed or released before the common host closes.
 * @evidence contracts/e2e.md#preserved-coverage The original stream-response transport, bodyless public-fetch seam, signature and schema assertions remain without a separate host/compiler.
 */
export const test_sdk_boundary_stream = async (
  connection: api.IConnection,
): Promise<void> => {
  const image = api.functional.sdk_boundary.transport.image;
  const streams: Array<
    [string, ReadableStream<Uint8Array<ArrayBufferLike>>, number[]]
  > = [
    ["actual bytes", await image(connection), [1, 2, 3, 4]],
    [
      "empty bytes",
      await image({
        ...connection,
        fetch: async () =>
          new Response(null, {
            status: 200,
            headers: { "Content-Type": "image/png" },
          }),
      }),
      [],
    ],
  ];
  for (const [label, stream, expected] of streams) {
    const reader = stream.getReader();
    const bytes: number[] = [];
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        bytes.push(...next.value);
      }
      assert.deepEqual(bytes, expected, label);
    } finally {
      try {
        await reader.cancel();
      } finally {
        reader.releaseLock();
      }
    }
  }
  const sandbox = path.resolve(__dirname, "../../..");
  const swagger = JSON.parse(
    await fs.readFile(path.join(sandbox, "swagger.json"), "utf8"),
  );
  assert.deepEqual(
    swagger.paths["/sdk_boundary/transport/image"].get.responses[200].content[
      "image/png"
    ].schema,
    { format: "binary", type: "string" },
  );
  const source = await fs.readFile(
    path.join(
      sandbox,
      "consumer/src/api/functional/sdk_boundary/transport/index.ts",
    ),
    "utf8",
  );
  assert.ok(
    source.includes(
      "export type Output = ReadableStream<Uint8Array<ArrayBufferLike>>;",
    ),
  );
  assert.ok(!source.includes("StreamableFile"));
};
