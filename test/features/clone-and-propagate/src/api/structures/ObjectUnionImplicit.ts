export type ObjectUnionImplicit = Array<ObjectUnionImplicit.IPoint | ObjectUnionImplicit.ILine | ObjectUnionImplicit.ITriangle | ObjectUnionImplicit.IRectangle | ObjectUnionImplicit.IPolyline | ObjectUnionImplicit.IPolygon | ObjectUnionImplicit.ICircle>;
export namespace ObjectUnionImplicit {
    export type IPoint = {
        x: number;
        y: number;
        slope?: null | number;
    }
    export type ILine = {
        p1: ObjectUnionImplicit.IPoint;
        p2: ObjectUnionImplicit.IPoint;
        width?: null | number;
        distance?: null | number;
    }
    export type ITriangle = {
        p1: ObjectUnionImplicit.IPoint;
        p2: ObjectUnionImplicit.IPoint;
        p3: ObjectUnionImplicit.IPoint;
        width?: null | number;
        height?: null | number;
        area?: null | number;
    }
    export type IRectangle = {
        p1: ObjectUnionImplicit.IPoint;
        p2: ObjectUnionImplicit.IPoint;
        p3: ObjectUnionImplicit.IPoint;
        p4: ObjectUnionImplicit.IPoint;
        width?: null | number;
        height?: null | number;
        area?: null | number;
    }
    export type IPolyline = {
        points: Array<ObjectUnionImplicit.IPoint>;
        length?: null | number;
    }
    export type IPolygon = {
        outer: ObjectUnionImplicit.IPolyline;
        inner?: Array<ObjectUnionImplicit.IPolyline>;
        area?: null | number;
    }
    export type ICircle = {
        centroid?: ObjectUnionImplicit.IPoint;
        radius: number;
        area?: null | number;
    }
}