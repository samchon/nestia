import typia from "typia";

import api from "../../../../api";
import type { IDirectory } from "../../../../api/structures/IDirectory";
import type { IImageFile } from "../../../../api/structures/IImageFile";
import type { IShortcut } from "../../../../api/structures/IShortcut";
import type { ITextFile } from "../../../../api/structures/ITextFile";
import type { IZipFile } from "../../../../api/structures/IZipFile";

export const test_api_arrayRecursiveUnionExplicit_store = async (
  connection: api.IConnection,
) => {
  const output: IDirectory | IImageFile | ITextFile | IZipFile | IShortcut =
    await api.functional.arrayRecursiveUnionExplicit.store(connection, {
      body: typia.random<
        IDirectory | IImageFile | ITextFile | IZipFile | IShortcut
      >(),
    });
  typia.assert(output);
};
