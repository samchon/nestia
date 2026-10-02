import { ArrayUtil, TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IMultipart } from "@api/lib/structures/IMultipart";

/**
 * Validates the generated consumer result.
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that multipart scalar and array fields echo exactly with single and repeated Blob/File uploads.
 * @evidence contracts/testing.md#independent-expectations Expectations come from authored content and the independent IMultipart result DTO, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns singleton and repeated files, numeric and string arrays.
 * @evidence contracts/testing.md#execution-ownership The multipart-form-data fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Generated clients connect their compiled arguments, transport encoding and decoded responses to real controller behavior.
 * @evidence contracts/e2e.md#shared-execution The multipart-form-data runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the multipart-form-data fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted singleton and repeated files, numeric and string arrays distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
 */
export const test_api_multipart = async (
  connection: api.IConnection,
): Promise<void> => {
  await ArrayUtil.asyncRepeat(10, async () => {
    const content: IMultipart.IContent = {
      title: "something",
      description: "nothing, but special",
      flags: [1, 2, 3, 4],
      notes: ["something, important", "note2"],
    };
    const result: IMultipart.IContent = await api.functional.multipart.post(
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
  });
};
