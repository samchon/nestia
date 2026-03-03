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
  const output:
    | IDirectory.o1
    | ISharedDirectory
    | IImageFile.o1
    | ITextFile.o1
    | IZipFile.o1
    | IShortcut.o1 = await api.functional.arrayRecursiveUnionImplicit.at(
    connection,
    {
      id: typia.random<number>(),
    },
  );
  typia.assert(output);
};
