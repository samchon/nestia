import { ArrayUtil, TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IMultipart } from "@api/lib/structures/IMultipart";

export const test_api_multipart = async (
  connection: api.IConnection,
): Promise<void> => {
  await ArrayUtil.asyncRepeat(10)(async () => {
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
    TestValidator.equals("result")(result)(content);
  });
};
