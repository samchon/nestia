import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia, { Primitive, Resolved } from "typia";

@nest.Controller("tupleRestController")
export class TupleRestController {
    @core.TypedRoute.Get()
    public get(): TupleRest {
        return [false, 1, "two", "three"];
    }
}

type TupleRest = [boolean, number, ...string[]];
