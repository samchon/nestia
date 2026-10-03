import { TestValidator } from "@nestia/e2e";

/**
 * Checks the original uploaded blob byte count, byte value and optional
 * filename.
 *
 * 1. Read this decoded blob once into a buffer.
 * 2. Check its exact length, every byte and the authored file name when present.
 *
 * @evidence contracts/common.md#principled-implementation Original literal length 999 and caller-provided byte/name expectations describe the authored multipart inputs independently of decoder output. Each uploaded blob is checked after decoding.
 * @evidence contracts/common.md#clear-and-simple-design One helper accepts the expected byte and optional name and returns the original async blob assertion. Controller iteration keeps each array element's distinct index expectation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The helper retains every original equality/predicate without synthesizing bytes, replacing Multer or altering the decoded file.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies byte count, byte value and optional name checks, and explains the single-read steps.
 * @evidence contracts/performance.md#efficient-algorithms Reading and checking one blob is linear in its byte length; Buffer.every stops on the first mismatch. Controller arrays visit each uploaded element once.
 * @evidence contracts/performance.md#reuse-equivalent-work Each blob is read once for its length and byte checks. Distinct uploaded bytes and expected indexes cannot share a validated result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned assertion retains only expected scalar values. Its array buffer and Buffer belong to one awaited invocation; no uploaded bytes survive in a cache or global collection.
 */
export const validateMultipartBlob =
  (value: number, name?: string) =>
  async (blob: Blob): Promise<void> => {
    const ab: ArrayBuffer = await blob.arrayBuffer();
    const buffer: Buffer = Buffer.from(ab);

    TestValidator.equals("buffer.length", buffer.length, 999);
    TestValidator.predicate("values", () =>
      buffer.every((byte) => byte === value),
    );
    if (blob instanceof File && name !== undefined)
      TestValidator.equals("file.name", name, blob.name);
  };
