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
 * @evidence contracts/testing.md#behavioral-verification The Fastify generated upload must return the exact title, single file name/text and ordered two-file name/text list.
 * @evidence contracts/testing.md#independent-expectations Handwritten File contents/names and the echo handler establish the expected output independently of generated multipart encoders or response shape validators.
 * @evidence contracts/testing.md#distinguishing-cases Scalar title, single and repeated file fields contrast form encoding paths on the authored Fastify parser setup. Separate fault cases retain malformed/over-limit rejection; this is the valid setup connection.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual Nest Fastify multipart parser, multer storage, generated form encoder and handler byte reads must interoperate; portable FormData construction cannot certify the parser registration.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
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
