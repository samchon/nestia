import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ICircle } from "../../../../api/structures/ICircle";
import type { ILine } from "../../../../api/structures/ILine";
import type { IPoint } from "../../../../api/structures/IPoint";
import type { IPolygon } from "../../../../api/structures/IPolygon";
import type { IPolyline } from "../../../../api/structures/IPolyline";
import type { IRectangle } from "../../../../api/structures/IRectangle";
import type { ITriangle } from "../../../../api/structures/ITriangle";

export const test_api_objectUnionImplicitControllere_get = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      200: (
        | IPoint.o1
        | ILine
        | ITriangle
        | IRectangle
        | IPolyline.o1
        | IPolygon
        | ICircle
      )[];
    },
    200
  > = await api.functional.objectUnionImplicitControllere.get(connection);
  typia.assert(output);
};
