import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IOriginal } from "../../../../api/structures/IOriginal";
import type { IPartialInterface } from "../../../../api/structures/IPartialInterface";

export const test_api_partial_dto_test_partial_interface_partialInterface =
  async (connection: api.IConnection) => {
    const output: IPropagation<
      {
        201: IPartialInterface;
      },
      201
    > =
      await api.functional.partial_dto_test.partial_interface.partialInterface(
        connection,
        typia.random<IOriginal.IPartialInterface>(),
      );
    typia.assert(output);
  };
