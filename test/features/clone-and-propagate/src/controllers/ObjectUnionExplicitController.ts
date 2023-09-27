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

export type ObjectUnionExplicit = Array<
    | ObjectUnionExplicit.Discriminator<"point", ObjectUnionExplicit.IPoint>
    | ObjectUnionExplicit.Discriminator<"line", ObjectUnionExplicit.ILine>
    | ObjectUnionExplicit.Discriminator<
          "triangle",
          ObjectUnionExplicit.ITriangle
      >
    | ObjectUnionExplicit.Discriminator<
          "rectangle",
          ObjectUnionExplicit.IRectangle
      >
    | ObjectUnionExplicit.Discriminator<
          "polyline",
          ObjectUnionExplicit.IPolyline
      >
    | ObjectUnionExplicit.Discriminator<"polygon", ObjectUnionExplicit.IPolygon>
    | ObjectUnionExplicit.Discriminator<"circle", ObjectUnionExplicit.ICircle>
>;
export namespace ObjectUnionExplicit {
    export type Discriminator<Type extends string, T extends object> = T & {
        type: Type;
    };
    export interface IPoint {
        x: number;
        y: number;
    }
    export interface ILine {
        p1: IPoint;
        p2: IPoint;
    }
    export interface ITriangle {
        p1: IPoint;
        p2: IPoint;
        p3: IPoint;
    }
    export interface IRectangle {
        p1: IPoint;
        p2: IPoint;
        p3: IPoint;
        p4: IPoint;
    }
    export interface IPolyline {
        points: IPoint[];
    }
    export interface IPolygon {
        outer: IPolyline;
        inner: IPolyline[];
    }
    export interface ICircle {
        centroid: IPoint;
        radius: number;
    }
}
