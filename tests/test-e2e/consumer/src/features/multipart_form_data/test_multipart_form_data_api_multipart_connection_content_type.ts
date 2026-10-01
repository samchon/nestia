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
 *
 * @evidence contracts/testing.md#behavioral-verification With a connection-level Content-Type application/json, generated disk upload must still return exact note.txt name, submitted text length and content.
 * @evidence contracts/testing.md#independent-expectations Handwritten File bytes/name establish the expected payload; multipart fetch must choose a boundary-bearing wire header rather than preserve an incompatible connection default.
 * @evidence contracts/testing.md#distinguishing-cases A conflicting default header contrasts the ordinary disk sibling. Exact content proves parsing reached the handler, though this case does not enumerate all header casing/default media types.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual fetch header construction and server multipart parsing must connect; a header-map unit alone cannot prove the browser/Node generated boundary remains usable.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
 */
export const test_multipart_form_data_api_multipart_connection_content_type =
  async (connection: api.IConnection): Promise<void> => {
    const content: string = "sent with a connection-level content type";
    const result = await api.functional.multipart_form_data.multipart.disk(
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
