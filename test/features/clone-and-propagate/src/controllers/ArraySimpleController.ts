import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia, { tags } from "typia";

@nest.Controller("arraySimple")
export class ArraySimpleController {
    @core.TypedRoute.Get()
    public index(): ArraySimple {
        return typia.random<ArraySimple>();
    }

    @core.TypedRoute.Get(":id")
    public at(
        @core.TypedParam("id") id: string & tags.Format<"uuid">,
    ): ArraySimple.IPerson {
        id;
        return typia.random<ArraySimple.IPerson>();
    }

    @core.TypedRoute.Post()
    public store(
        @core.TypedBody() body: ArraySimple.IPerson,
    ): ArraySimple.IPerson {
        return body;
    }
}

export type ArraySimple = ArraySimple.IPerson[];
export namespace ArraySimple {
    export interface IPerson {
        name: string;
        email: string;
        hobbies: IHobby[];
    }
    export interface IHobby {
        name: string;
        body: string;
        rank: number;
    }
}
