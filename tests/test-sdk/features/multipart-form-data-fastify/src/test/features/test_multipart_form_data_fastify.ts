import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies `@TypedFormData.Body()` uploads files on NestJS 11's Fastify.
 *
 * The guide registered `fastify-multer`'s `contentParser` plugin, which
 * declares the content type `multipart` without a subtype; Fastify 5, which
 * NestJS 11's adapter runs, rejects that with `FST_ERR_CTP_INVALID_TYPE`, so no
 * documented Fastify setup could upload (#1673). The application registers a
 * `multipart/form-data` parser that leaves the stream to `fastify-multer`.
 *
 * 1. Upload a title, one file, and two files through the SDK.
 * 2. Assert the route read every field and file.
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that Fastify upload echoes title and names/text of singleton and repeated files.
 * @evidence contracts/testing.md#independent-expectations Expectations come from literal authored file names and text, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns scalar fields and one/two files on Fastify.
 * @evidence contracts/testing.md#execution-ownership The multipart-form-data-fastify fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Generated clients connect their compiled arguments, transport encoding and decoded responses to real controller behavior.
 * @evidence contracts/e2e.md#shared-execution The multipart-form-data-fastify runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the multipart-form-data-fastify fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted scalar fields and one/two files on Fastify distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
 */
export const test_multipart_form_data_fastify = async (
  connection: api.IConnection,
): Promise<void> => {
  const file = (name: string, text: string): File =>
    new File([text], name, { type: "text/plain" });
  const output = await api.functional.multipart.post(connection, {
    title: "fastify",
    file: file("first.txt", "first"),
    files: [file("0.txt", "zero"), file("1.txt", "one")],
  });
  TestValidator.equals("output", output, {
    title: "fastify",
    file: { name: "first.txt", text: "first" },
    files: [
      { name: "0.txt", text: "zero" },
      { name: "1.txt", text: "one" },
    ],
  });
};
