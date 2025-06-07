import type { IPropagation } from "@nestia/fetcher";
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
  const output: IPropagation<
    {
      201: IDirectory | IImageFile | ITextFile | IZipFile | IShortcut;
    },
    201
  > = await api.functional.arrayRecursiveUnionExplicit.store(
    connection,
    typia.random<api.functional.arrayRecursiveUnionExplicit.store.Body>(),
  );
  typia.assert(output);
};
