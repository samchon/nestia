import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";
import type { INotFound } from "../../../../api/structures/INotFound";
import type { IUnprocessibleEntity } from "../../../../api/structures/IUnprocessibleEntity";

export const test_api_exception_union = async (connection: api.IConnection) => {
  const output: Primitive<INotFound | IUnprocessibleEntity | IBbsArticle> =
    await api.functional.exception.union(connection, typia.random<string>());
  typia.assert(output);
};
