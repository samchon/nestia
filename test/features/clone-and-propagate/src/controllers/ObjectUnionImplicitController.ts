import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

@nest.Controller("objectUnionImplicitControllere")
export class ObjectUnionImplicitController {
  @core.TypedRoute.Get()
  public get(): ObjectUnionImplicit {
    return typia.random<ObjectUnionImplicit>();
  }
}

type ObjectUnionImplicit = Array<
  IPoint | ILine | ITriangle | IRectangle | IPolyline | IPolygon | ICircle
>;
interface IPoint {
  x: number;
  y: number;
  slope?: number | null;
}
interface ILine {
  p1: IPoint;
  p2: IPoint;
  width?: number | null;
  distance?: number | null;
}
interface ITriangle {
  p1: IPoint;
  p2: IPoint;
  p3: IPoint;
  width?: number | null;
  height?: number | null;
  area?: number | null;
}
interface IRectangle {
  p1: IPoint;
  p2: IPoint;
  p3: IPoint;
  p4: IPoint;
  width?: number | null;
  height?: number | null;
  area?: number | null;
}
interface IPolyline {
  points: IPoint[];
  length?: number | null;
}
interface IPolygon {
  outer: IPolyline;
  inner?: IPolyline[];
  area?: number | null;
}
interface ICircle {
  centroid?: IPoint;
  radius: number;
  area?: number | null;
}
