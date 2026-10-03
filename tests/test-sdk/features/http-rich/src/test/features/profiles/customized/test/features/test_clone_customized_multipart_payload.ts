import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { CustomizedIMultipart } from "../../../../../../structures/customized/multipart/CustomizedIMultipart";
import api from "../../api";

/**
 * Validates the generated consumer result.
 *
 * 1. Execute the original generated request against the actual multipart/profile
 *    handler.
 * 2. Require the original literal or source-type assertions below.
 *
 * @evidence contracts/testing.md#behavioral-verification One request carries the original ten distinct blob values and ten filenames, scalar arrays and optional notes; result shape and exact content and every controller byte/name assertion remain. Ten original outer iterations sent identical authored bytes to stateless handlers, so one preserves every distinguishing input.
 * @evidence contracts/testing.md#independent-expectations Original authored bytes, filenames, content and DTO types define the expected output independently of emitted clients and decoded requests.
 * @evidence contracts/testing.md#distinguishing-cases One request carries the original ten distinct blob values and ten filenames, scalar arrays and optional notes; result shape and exact content and every controller byte/name assertion remain. Ten original outer iterations sent identical authored bytes to stateless handlers, so one preserves every distinguishing input.
 * @evidence contracts/testing.md#execution-ownership The matching exported case runs through DynamicExecutor in the shared compiled customized-profile consumer; controller-side blob assertions execute through its actual request.
 * @evidence contracts/e2e.md#necessary-boundary The installed generated client must encode all authored multipart bytes and names, native decoding and actual memory-storage Multer must recover them, and transformed response serialization must retain the exact source content.
 * @evidence contracts/e2e.md#shared-execution Original SDK/Swagger settings match the existing customized graph. All multipart inputs join its same generation, producer, consumer and listener without automated E2E generation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private identities/routes isolate these stateless handlers. Disk uploads stay inside the owned compiled fixture, which the runner recreates before preparation; no shared workspace cache or retained decoded payload is used.
 * @evidence contracts/e2e.md#preserved-coverage Original literals, DTO assertions and controller byte/name checks remain. The identical outer ten-request loop is reduced to one complete payload; compile-only Blob/File schema and form-data calls remain in MultipartSchemaConnections.
 */
export const test_clone_customized_multipart_payload = async (
  connection: api.IConnection,
): Promise<void> => {
  const content: CustomizedIMultipart.IContent = {
    title: "something",
    description: "nothing, but special",
    flags: [1, 2, 3, 4],
    notes: ["something, important", "note2"],
  };
  const result: CustomizedIMultipart.IContent =
    await api.functional.http_rich.options.customized.multipart.post(
      connection,
      {
        title: content.title,
        blob: new Blob([new Uint8Array(999).fill(0)]),
        blobs: new Array(10)
          .fill(0)
          .map((_, i) => new Blob([new Uint8Array(999).fill(i)])),
        description: content.description,
        file: new File([new Uint8Array(999).fill(1)], "first.png"),
        flags: content.flags,
        files: new Array(10)
          .fill(0)
          .map((_, i) => new File([new Uint8Array(999).fill(i)], `${i}.png`)),
        notes: content.notes,
      },
    );
  typia.assertEquals(result);
  TestValidator.equals("result", result, content);
};
