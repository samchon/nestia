import { MigrateFetcher } from "@nestia/fetcher/lib/MigrateFetcher";
import typia from "typia";

import { IMultipart } from "@api/lib/structures/IMultipart";

import { ITestProps } from "../../ITestProps";

export const test_api_multipart_post = async (
  props: ITestProps,
): Promise<void> => {
  console.log(props.route("post", "/multipart").body?.type);
  const content: IMultipart.IContent = await MigrateFetcher.request({
    route: props.route("post", "/multipart"),
    connection: props.connection,
    arguments: [
      {
        title: "something",
        blob: new Blob([new Uint8Array(999).fill(0)]),
        blobs: new Array(10)
          .fill(0)
          .map((_, i) => new Blob([new Uint8Array(999).fill(i)])),
        description: "nothing, but special",
        file: new File([new Uint8Array(999).fill(1)], "first.png"),
        flags: [1, 2, 3, 4],
        files: new Array(10)
          .fill(0)
          .map((_, i) => new File([new Uint8Array(999).fill(i)], `${i}.png`)),
        notes: ["something, important", "note2"],
      } satisfies IMultipart,
    ],
  });
  typia.assert(content);
};
