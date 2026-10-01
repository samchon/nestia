import { ArrayUtil, TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../api";
import { IMultipartMultipartFormData } from "../../oracle/multipart_form_data/structures/IMultipartMultipartFormData";

/**
 * Verifies api multipart through its generated consumer.
 *
 * The authored input and handler establish the observable contract.
 *
 * 1. Exercise the retained generated request or document.
 * 2. Assert its exact payload, shape or selected media constraints.
 *
 * @evidence contracts/testing.md#behavioral-verification Ten awaited multipart requests must return exact scalar/array content and every uploaded byte and file name. Independent caller expectations now verify server byte reads without imposing hidden content constraints on type-valid generated requests.
 * @evidence contracts/testing.md#independent-expectations Literal title/description/flags/notes and explicitly filled bytes/names establish independent expected content. Installed typia additionally checks the exact returned IContentMultipartFormData shape rather than providing the only value oracle.
 * @evidence contracts/testing.md#distinguishing-cases Single/repeated Blob/File, distinct per-index bytes, repeated numeric/string fields and commas distinguish encoding branches. Ten original repeats preserve their checks; one zero-byte/empty-array/arbitrary-name-and-bytes control proves acceptance is not restricted to hidden 999-byte fixture contents. Malformed multipart belongs to its separate boundary owner.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated form encoding, HTTP multipart parsing, Blob/File decoding and handler byte reads must connect; constructing equivalent FormData alone cannot establish the uploaded bytes.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
 */
export const test_multipart_form_data_api_multipart = async (
  connection: api.IConnection,
): Promise<void> => {
  await ArrayUtil.asyncRepeat(10, async () => {
    const content: Omit<
      IMultipartMultipartFormData.IContentMultipartFormData,
      "uploads"
    > = {
      title: "something",
      description: "nothing, but special",
      flags: [1, 2, 3, 4],
      notes: ["something, important", "note2"],
    };
    const result: IMultipartMultipartFormData.IContentMultipartFormData =
      await api.functional.multipart_form_data.multipart.post(connection, {
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
      });
    typia.assertEquals(result);
    const { uploads, ...returnedContent } = result;
    TestValidator.equals("result", returnedContent, content);
    TestValidator.equals("uploaded bytes and names", uploads, {
      blob: Array.from(new Uint8Array(999).fill(0)),
      blobs: Array.from({ length: 10 }, (_, i) =>
        Array.from(new Uint8Array(999).fill(i)),
      ),
      file: {
        name: "first.png",
        bytes: Array.from(new Uint8Array(999).fill(1)),
      },
      files: Array.from({ length: 10 }, (_, i) => ({
        name: `${i}.png`,
        bytes: Array.from(new Uint8Array(999).fill(i)),
      })),
    });
  });
  const arbitrary = await api.functional.multipart_form_data.multipart.post(
    connection,
    {
      title: "other contents",
      description: null,
      flags: [],
      blob: new Blob([]),
      blobs: [],
      file: new File([new Uint8Array([10, 254, 255])], "arbitrary.bin"),
      files: [],
    },
  );
  typia.assertEquals(arbitrary);
  TestValidator.equals("empty and arbitrary uploads", arbitrary, {
    title: "other contents",
    description: null,
    flags: [],
    uploads: {
      blob: [],
      blobs: [],
      file: { name: "arbitrary.bin", bytes: [10, 254, 255] },
      files: [],
    },
  });
};
