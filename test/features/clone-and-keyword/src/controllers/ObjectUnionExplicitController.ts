import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

@nest.Controller("objectUnionExplicit")
export class ObjectUnionExplicitController {
  @core.TypedRoute.Get()
  public get(): ObjectUnionExplicit {
    return typia.random<ObjectUnionExplicit>();
  }
}

type ObjectUnionExplicit = Array<
  | Discriminator<"point", IPoint>
  | Discriminator<"line", ILine>
  | Discriminator<"triangle", ITriangle>
  | Discriminator<"rectangle", IRectangle>
  | Discriminator<"polyline", IPolyline>
  | Discriminator<"polygon", IPolygon>
  | Discriminator<"circle", ICircle>
>;
type Discriminator<Type extends string, T extends object> = T & {
  type: Type;
};
interface IPoint {
  x: number;
  y: number;
}
interface ILine {
  p1: IPoint;
  p2: IPoint;
}
interface ITriangle {
  p1: IPoint;
  p2: IPoint;
  p3: IPoint;
}
interface IRectangle {
  p1: IPoint;
  p2: IPoint;
  p3: IPoint;
  p4: IPoint;
}
interface IPolyline {
  points: IPoint[];
}
interface IPolygon {
  outer: IPolyline;
  inner: IPolyline[];
}
interface ICircle {
  centroid: IPoint;
  radius: number;
}
