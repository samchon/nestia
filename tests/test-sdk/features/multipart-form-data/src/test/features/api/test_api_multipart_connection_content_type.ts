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
