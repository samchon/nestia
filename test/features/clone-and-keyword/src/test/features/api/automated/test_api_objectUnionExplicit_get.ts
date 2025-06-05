import typia from "typia";

import api from "../../../../api";
import type { DiscriminatorcircleICircle } from "../../../../api/structures/DiscriminatorcircleICircle";
import type { DiscriminatorlineILine } from "../../../../api/structures/DiscriminatorlineILine";
import type { DiscriminatorpointIPoint } from "../../../../api/structures/DiscriminatorpointIPoint";
import type { DiscriminatorpolygonIPolygon } from "../../../../api/structures/DiscriminatorpolygonIPolygon";
import type { DiscriminatorpolylineIPolyline } from "../../../../api/structures/DiscriminatorpolylineIPolyline";
import type { DiscriminatorrectangleIRectangle } from "../../../../api/structures/DiscriminatorrectangleIRectangle";
import type { DiscriminatortriangleITriangle } from "../../../../api/structures/DiscriminatortriangleITriangle";

export const test_api_objectUnionExplicit_get = async (
  connection: api.IConnection,
) => {
  const output: (
    | DiscriminatorpointIPoint
    | DiscriminatorlineILine
    | DiscriminatortriangleITriangle
    | DiscriminatorrectangleIRectangle
    | DiscriminatorpolylineIPolyline
    | DiscriminatorpolygonIPolygon
    | DiscriminatorcircleICircle
  )[] = await api.functional.objectUnionExplicit.get(connection);
  typia.assert(output);
};
