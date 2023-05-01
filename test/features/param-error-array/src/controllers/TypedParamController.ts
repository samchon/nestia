import { Controller } from "@nestjs/common";

import core from "@nestia/core";

@Controller("param")
export class TypedParamController {
    @core.TypedRoute.Get(":value")
    public param(@core.TypedParam("value") value: string[]): void {
        value;
    }
}
