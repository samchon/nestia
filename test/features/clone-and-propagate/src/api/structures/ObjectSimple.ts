export namespace ObjectSimple {
    export type IBox3D = {
        scale: ObjectSimple.IPoint3D;
        position: ObjectSimple.IPoint3D;
        rotate: ObjectSimple.IPoint3D;
        pivot: ObjectSimple.IPoint3D;
    }
    export type IPoint3D = {
        x: number;
        y: number;
        z: number;
    }
}