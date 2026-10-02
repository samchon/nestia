import { TestValidator } from "@nestia/e2e";

import api from "@api";

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
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that multipart upload with application/json connection header preserves filename, size and text.
 * @evidence contracts/testing.md#independent-expectations Expectations come from authored filename/text and fetch's multipart boundary ownership, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns conflicting content type versus ordinary disk upload.
 * @evidence contracts/testing.md#execution-ownership The multipart-form-data fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Generated clients connect their compiled arguments, transport encoding and decoded responses to real controller behavior.
 * @evidence contracts/e2e.md#shared-execution The multipart-form-data runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the multipart-form-data fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted conflicting content type versus ordinary disk upload distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
 */
export const test_api_multipart_connection_content_type = async (
  connection: api.IConnection,
): Promise<void> => {
  const content: string = "sent with a connection-level content type";
  const result = await api.functional.multipart.disk(
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
