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
 * @evidence contracts/testing.md#behavioral-verification Generated disk upload must return exact note.txt name, stored on disk text and its length.
 * @evidence contracts/testing.md#independent-expectations Explicit File input and handler file.text/name/size reads establish independent expected bytes; undefined-buffer placeholder decoding cannot satisfy this literal output.
 * @evidence contracts/testing.md#distinguishing-cases Disk storage contrasts the existing memory Blob/File request. This case verifies consumed bytes; the fault sibling owns observable empty-directory checks after success/rejection.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual multer disk storage, decorator file decoding and handler reads must interoperate through generated HTTP upload; memory-buffer units cannot certify stored-file bytes.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
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
