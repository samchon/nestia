import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

@nest.Controller("arrayRecursive")
export class ArrayRecursiveController {
    @core.TypedRoute.Get()
    public index(): ArrayRecursive[] {
        return typia.random<ArrayRecursive[]>();
    }

    @core.TypedRoute.Get(":id")
    public at(@core.TypedParam("id") id: number): ArrayRecursive {
        id;
        return typia.random<ArrayRecursive>();
    }

    @core.TypedRoute.Post()
    public store(@core.TypedBody() body: ArrayRecursive): ArrayRecursive {
        return body;
    }
}

type ArrayRecursive = ArrayRecursive.ICategory;
namespace ArrayRecursive {
    export interface ICategory {
        children: ICategory[];
        id: number;
        code: string;
        sequence: number;
        created_at: ITimestamp;
    }
    export interface ITimestamp {
        time: number;
        zone: number;
    }
}
