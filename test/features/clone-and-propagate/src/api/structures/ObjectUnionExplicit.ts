export type ObjectUnionExplicit = Array<ObjectUnionExplicit.DiscriminatorpointObjectUnionExplicit.IPoint | ObjectUnionExplicit.DiscriminatorlineObjectUnionExplicit.ILine | ObjectUnionExplicit.DiscriminatortriangleObjectUnionExplicit.ITriangle | ObjectUnionExplicit.DiscriminatorrectangleObjectUnionExplicit.IRectangle | ObjectUnionExplicit.DiscriminatorpolylineObjectUnionExplicit.IPolyline | ObjectUnionExplicit.DiscriminatorpolygonObjectUnionExplicit.IPolygon | ObjectUnionExplicit.DiscriminatorcircleObjectUnionExplicit.ICircle>;
export namespace ObjectUnionExplicit {
    export namespace DiscriminatorpointObjectUnionExplicit {
        export type IPoint = {
            x: number;
            y: number;
            type: ("point");
        }
    }
    export namespace DiscriminatorlineObjectUnionExplicit {
        export type ILine = {
            p1: ObjectUnionExplicit.IPoint;
            p2: ObjectUnionExplicit.IPoint;
            type: ("line");
        }
    }
    export namespace DiscriminatortriangleObjectUnionExplicit {
        export type ITriangle = {
            p1: ObjectUnionExplicit.IPoint;
            p2: ObjectUnionExplicit.IPoint;
            p3: ObjectUnionExplicit.IPoint;
            type: ("triangle");
        }
    }
    export namespace DiscriminatorrectangleObjectUnionExplicit {
        export type IRectangle = {
            p1: ObjectUnionExplicit.IPoint;
            p2: ObjectUnionExplicit.IPoint;
            p3: ObjectUnionExplicit.IPoint;
            p4: ObjectUnionExplicit.IPoint;
            type: ("rectangle");
        }
    }
    export namespace DiscriminatorpolylineObjectUnionExplicit {
        export type IPolyline = {
            points: Array<ObjectUnionExplicit.IPoint>;
            type: ("polyline");
        }
    }
    export namespace DiscriminatorpolygonObjectUnionExplicit {
        export type IPolygon = {
            outer: ObjectUnionExplicit.IPolyline;
            inner: Array<ObjectUnionExplicit.IPolyline>;
            type: ("polygon");
        }
    }
    export namespace DiscriminatorcircleObjectUnionExplicit {
        export type ICircle = {
            centroid: ObjectUnionExplicit.IPoint;
            radius: number;
            type: ("circle");
        }
    }
    export type IPoint = {
        x: number;
        y: number;
    }
    export type IPolyline = {
        points: Array<ObjectUnionExplicit.IPoint>;
    }
}