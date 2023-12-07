export type ObjectUnionImplicit = Array<ObjectUnionImplicit.IPoint | ObjectUnionImplicit.ILine | ObjectUnionImplicit.ITriangle | ObjectUnionImplicit.IRectangle | ObjectUnionImplicit.IPolyline | ObjectUnionImplicit.IPolygon | ObjectUnionImplicit.ICircle>;
export namespace ObjectUnionImplicit {
    export type IPoint = {
        x: number;
        y: number;
        slope?: null | undefined | number;
    }
    export type ILine = {
        p1: ObjectUnionImplicit.IPoint;
        p2: ObjectUnionImplicit.IPoint;
        width?: null | undefined | number;
        distance?: null | undefined | number;
    }
    export type ITriangle = {
        p1: ObjectUnionImplicit.IPoint;
        p2: ObjectUnionImplicit.IPoint;
        p3: ObjectUnionImplicit.IPoint;
        width?: null | undefined | number;
        height?: null | undefined | number;
        area?: null | undefined | number;
    }
    export type IRectangle = {
        p1: ObjectUnionImplicit.IPoint;
        p2: ObjectUnionImplicit.IPoint;
        p3: ObjectUnionImplicit.IPoint;
        p4: ObjectUnionImplicit.IPoint;
        width?: null | undefined | number;
        height?: null | undefined | number;
        area?: null | undefined | number;
    }
    export type IPolyline = {
        points: Array<ObjectUnionImplicit.IPoint>;
        length?: null | undefined | number;
    }
    export type IPolygon = {
        outer: ObjectUnionImplicit.IPolyline;
        inner?: undefined | Array<ObjectUnionImplicit.IPolyline>;
        area?: null | undefined | number;
    }
    export type ICircle = {
        centroid?: undefined | ObjectUnionImplicit.IPoint;
        radius: number;
        area?: null | undefined | number;
    }
}