import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies an upload arrives when the connection carries a default
 * `Content-Type` header.
 *
 * The fetcher left a connection-level `Content-Type` on multipart requests, so
 * `Content-Type: application/json` replaced the `multipart/form-data;
 * boundary=...` fetch writes, and the server could not parse the body (#1707).
 *
 * 1. Upload a file through the SDK with `Content-Type: application/json` in the
 *    connection's headers.
 * 2. Assert the handler read the file's name, size, and content.
 * 3. Execute the original generated request against the actual multipart/profile
 *    handler.
 * 4. Require the original literal or source-type assertions below.
 *
 * @evidence contracts/testing.md#behavioral-verification The connection-level application/json header must not replace the multipart boundary; the exact disk-decoded filename, byte count and text remain.
 * @evidence contracts/testing.md#independent-expectations Original authored bytes, filenames, content and DTO types define the expected output independently of emitted clients and decoded requests.
 * @evidence contracts/testing.md#distinguishing-cases The connection-level application/json header must not replace the multipart boundary; the exact disk-decoded filename, byte count and text remain.
 * @evidence contracts/testing.md#execution-ownership The matching exported case runs through DynamicExecutor in the shared compiled customized-profile consumer; controller-side blob assertions execute through its actual request.
 * @evidence contracts/e2e.md#necessary-boundary The actual generated disk upload must remove the connection-level JSON content type and let fetch supply its multipart boundary; only the connected fetcher/parser/decoder/handler proves the exact decoded bytes.
 * @evidence contracts/e2e.md#shared-execution Original SDK/Swagger settings match the existing customized graph. All multipart inputs join its same generation, producer, consumer and listener without automated E2E generation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private identities/routes isolate these stateless handlers. Disk uploads stay inside the owned compiled fixture, which the runner recreates before preparation; no shared workspace cache or retained decoded payload is used.
 * @evidence contracts/e2e.md#preserved-coverage Original literals, DTO assertions and controller byte/name checks remain. The identical outer ten-request loop is reduced to one complete payload; compile-only Blob/File schema and form-data calls remain in MultipartSchemaConnections.
 */
export const test_clone_customized_multipart_content_type = async (
  connection: api.IConnection,
): Promise<void> => {
  const content: string = "sent with a connection-level content type";
  const result =
    await api.functional.http_rich.options.customized.multipart.disk(
      {
        ...connection,
        headers: { ...connection.headers, "Content-Type": "application/json" },
      },
      { file: new File([content], "note.txt", { type: "text/plain" }) },
    );
  TestValidator.equals("disk", result, {
    name: "note.txt",
    size: content.length,
    text: content,
  });
};
