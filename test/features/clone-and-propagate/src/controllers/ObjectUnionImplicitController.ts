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

export type ObjectUnionImplicit = Array<
    | ObjectUnionImplicit.IPoint
    | ObjectUnionImplicit.ILine
    | ObjectUnionImplicit.ITriangle
    | ObjectUnionImplicit.IRectangle
    | ObjectUnionImplicit.IPolyline
    | ObjectUnionImplicit.IPolygon
    | ObjectUnionImplicit.ICircle
>;
export namespace ObjectUnionImplicit {
    export interface IPoint {
        x: number;
        y: number;
        slope?: number | null;
    }
    export interface ILine {
        p1: IPoint;
        p2: IPoint;
        width?: number | null;
        distance?: number | null;
    }
    export interface ITriangle {
        p1: IPoint;
        p2: IPoint;
        p3: IPoint;
        width?: number | null;
        height?: number | null;
        area?: number | null;
    }
    export interface IRectangle {
        p1: IPoint;
        p2: IPoint;
        p3: IPoint;
        p4: IPoint;
        width?: number | null;
        height?: number | null;
        area?: number | null;
    }
    export interface IPolyline {
        points: IPoint[];
        length?: number | null;
    }
    export interface IPolygon {
        outer: IPolyline;
        inner?: IPolyline[];
        area?: number | null;
    }
    export interface ICircle {
        centroid?: IPoint;
        radius: number;
        area?: number | null;
    }
}
