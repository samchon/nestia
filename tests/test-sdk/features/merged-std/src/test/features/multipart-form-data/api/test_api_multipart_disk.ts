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
 */
export const test_api_multipart_disk = async (
  connection: api.IConnection,
): Promise<void> => {
  const content: string = "stored on disk";
  const result = await api.functional.multipart_form_data.multipart.disk(connection, {
    file: new File([content], "note.txt", { type: "text/plain" }),
  });
  TestValidator.equals("disk", result, {
    name: "note.txt",
    size: content.length,
    text: content,
  });
};
