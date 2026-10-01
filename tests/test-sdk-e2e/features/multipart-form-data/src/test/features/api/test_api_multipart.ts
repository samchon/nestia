import { ArrayUtil, TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IMultipart } from "@api/lib/structures/IMultipart";

/**
 * Verifies api multipart through its generated consumer.
 *
 * The authored input and handler establish the observable contract.
 *
 * 1. Exercise the retained generated request or document.
 * 2. Assert its exact payload, shape or selected media constraints.
 *
 * @evidence contracts/testing.md#behavioral-verification Ten awaited multipart requests must each return the exact submitted scalar/array content, while the authored handler checks every999-byte Blob/File against its expected byte and file name.
 * @evidence contracts/testing.md#independent-expectations Literal title/description/flags/notes and explicitly filled bytes/names establish independent expected content. Installed typia additionally checks the exact returned IContent shape rather than providing the only value oracle.
 * @evidence contracts/testing.md#distinguishing-cases Single/repeated Blob/File, distinct per-index bytes, repeated numeric/string fields and commas in descriptions distinguish encoding/storage branches. Ten repeats retain reuse coverage but are not an exhaustive size/malformed population.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated form encoding, HTTP multipart parsing, Blob/File decoding and handler byte reads must connect; constructing equivalent FormData alone cannot establish the uploaded bytes.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
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
