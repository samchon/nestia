import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

@nest.Controller("tupleHierarchicalController")
export class TupleHierarchicalController {
    @core.TypedRoute.Get()
    public index(): TupleHierarchical[] {
        return typia.random<TupleHierarchical[]>();
    }

    @core.TypedRoute.Get(":id")
    public at(@core.TypedParam("id") id: number): TupleHierarchical {
        id;
        return typia.random<TupleHierarchical>();
    }

    @core.TypedRoute.Post()
    public store(@core.TypedBody() body: TupleHierarchical): TupleHierarchical {
        return body;
    }
}

type TupleHierarchical = [
    boolean,
    null,
    number,
    [boolean, null, [number, [boolean, string]]],
    [
        number,
        Array<[string, boolean, Array<[number, number, [boolean, string]]>]>,
    ],
];
