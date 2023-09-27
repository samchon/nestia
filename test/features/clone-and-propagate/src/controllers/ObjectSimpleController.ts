import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

@nest.Controller("objectSimple")
export class ObjectSimpleController {
    @core.TypedRoute.Get()
    public index(): ObjectSimple[] {
        return typia.random<ObjectSimple[]>();
    }

    @core.TypedRoute.Get(":id")
    public at(@core.TypedParam("id") id: number): ObjectSimple {
        id;
        return typia.random<ObjectSimple>();
    }

    @core.TypedRoute.Post()
    public store(@core.TypedBody() body: ObjectSimple): ObjectSimple {
        return body;
    }
}

export type ObjectSimple = ObjectSimple.IBox3D;
export namespace ObjectSimple {
    export interface IBox3D {
        scale: IPoint3D;
        position: IPoint3D;
        rotate: IPoint3D;
        pivot: IPoint3D;
    }
    export interface IPoint3D {
        x: number;
        y: number;
        z: number;
    }
}
