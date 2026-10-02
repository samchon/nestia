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
