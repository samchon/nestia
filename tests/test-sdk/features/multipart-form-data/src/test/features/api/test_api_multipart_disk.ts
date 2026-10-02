import { TestValidator } from "@nestia/e2e";

import api from "@api";

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
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that disk-backed upload preserves filename, size and content.
 * @evidence contracts/testing.md#independent-expectations Expectations come from authored filename and bytes, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns disk storage versus memory storage; rejected uploads belong to the faults fixture.
 * @evidence contracts/testing.md#execution-ownership The multipart-form-data fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Generated clients connect their compiled arguments, transport encoding and decoded responses to real controller behavior.
 * @evidence contracts/e2e.md#shared-execution The multipart-form-data runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the multipart-form-data fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted disk storage versus memory storage; rejected uploads belong to the faults fixture distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
 */
export const test_api_multipart_disk = async (
  connection: api.IConnection,
): Promise<void> => {
  const content: string = "stored on disk";
  const result = await api.functional.multipart.disk(connection, {
    file: new File([content], "note.txt", { type: "text/plain" }),
  });
  TestValidator.equals("disk", result, {
    name: "note.txt",
    size: content.length,
    text: content,
  });
};
