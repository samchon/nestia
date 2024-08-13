import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IDirectory } from "../../../../api/structures/IDirectory";
import type { IImageFile } from "../../../../api/structures/IImageFile";
import type { ISharedDirectory } from "../../../../api/structures/ISharedDirectory";
import type { IShortcut } from "../../../../api/structures/IShortcut";
import type { ITextFile } from "../../../../api/structures/ITextFile";
import type { IZipFile } from "../../../../api/structures/IZipFile";

export const test_api_arrayRecursiveUnionImplicit_at = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      200:
        | IDirectory
        | IImageFile
        | ISharedDirectory
        | IShortcut
        | ITextFile
        | IZipFile;
    },
    200
  > = await api.functional.arrayRecursiveUnionImplicit.at(
    connection,
    typia.random<number>(),
  );
  typia.assert(output);
};
