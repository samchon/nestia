import type { ICircle } from "./ICircle";
import type { ILine } from "./ILine";
import type { IPoint } from "./IPoint";
import type { IPolygon } from "./IPolygon";
import type { IPolyline } from "./IPolyline";
import type { IRectangle } from "./IRectangle";
import type { ITriangle } from "./ITriangle";

export type ObjectUnionImplicit = (
  | IPoint.o1
  | ILine
  | ITriangle
  | IRectangle
  | IPolyline.o1
  | IPolygon
  | ICircle
)[];
