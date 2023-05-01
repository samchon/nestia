import { Controller } from "@nestjs/common";

import core from "@nestia/core";

@Controller("param")
export class TypedParamController {
    @core.TypedRoute.Get(":value")
    public param<T extends string | number | boolean | bigint>(
        @core.TypedParam("value") value: T,
    ): void {
        value;
    }
}
