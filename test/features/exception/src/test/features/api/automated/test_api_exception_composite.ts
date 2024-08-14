import type { Primitive } from "@nestia/fetcher";
import typia from "typia";
import type { TypeGuardError } from "typia/lib/TypeGuardError";

import api from "../../../../api";
import type { IBbsArticle } from "../../../../api/structures/IBbsArticle";
import type { IInternalServerError } from "../../../../api/structures/IInternalServerError";
import type { INotFound } from "../../../../api/structures/INotFound";
import type { IUnprocessibleEntity } from "../../../../api/structures/IUnprocessibleEntity";

export const test_api_exception_composite = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IBbsArticle> =
    await api.functional.exception.composite(
      connection,
      typia.random<string>(),
      typia.random<IBbsArticle.IStore>(),
    );
  typia.assert(output);
};
