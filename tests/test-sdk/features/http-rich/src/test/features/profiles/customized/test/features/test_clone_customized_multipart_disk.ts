import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies an upload kept by multer's disk storage reaches the handler with its
 * bytes.
 *
 * The decoder built every uploaded file from `file.buffer`, which disk storage
 * leaves undefined, so the handler received a 9-byte file reading "undefined"
 * (#1669). It now reads the stored file.
 *
 * 1. Upload a text file to a route using `Multer.diskStorage()`.
 * 2. Assert the handler saw its name, size, and content.
 * 3. Execute the original generated request against the actual multipart/profile
 *    handler.
 * 4. Require the original literal or source-type assertions below.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual disk-storage upload must retain original filename, byte count and text, rejecting the historical undefined-buffer decoding.
 * @evidence contracts/testing.md#independent-expectations Original authored bytes, filenames, content and DTO types define the expected output independently of emitted clients and decoded requests.
 * @evidence contracts/testing.md#distinguishing-cases The actual disk-storage upload must retain original filename, byte count and text, rejecting the historical undefined-buffer decoding.
 * @evidence contracts/testing.md#execution-ownership The matching exported case runs through DynamicExecutor in the shared compiled customized-profile consumer; controller-side blob assertions execute through its actual request.
 * @evidence contracts/e2e.md#necessary-boundary The actual generated upload, Multer disk storage and native file decoder must deliver the stored file bytes rather than an undefined buffer to the real handler.
 * @evidence contracts/e2e.md#shared-execution Original SDK/Swagger settings match the existing customized graph. All multipart inputs join its same generation, producer, consumer and listener without automated E2E generation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private identities/routes isolate these stateless handlers. Disk uploads stay inside the owned compiled fixture, which the runner recreates before preparation; no shared workspace cache or retained decoded payload is used.
 * @evidence contracts/e2e.md#preserved-coverage Original literals, DTO assertions and controller byte/name checks remain. The identical outer ten-request loop is reduced to one complete payload; compile-only Blob/File schema and form-data calls remain in MultipartSchemaConnections.
 */
export const test_clone_customized_multipart_disk = async (
  connection: api.IConnection,
): Promise<void> => {
  const content: string = "stored on disk";
  const result =
    await api.functional.http_rich.options.customized.multipart.disk(
      connection,
      {
        file: new File([content], "note.txt", { type: "text/plain" }),
      },
    );
  TestValidator.equals("disk", result, {
    name: "note.txt",
    size: content.length,
    text: content,
  });
};
