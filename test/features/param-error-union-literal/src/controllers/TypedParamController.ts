import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("param")
export class TypedParamController {
    @core.TypedRoute.Get(":value")
    public param(@core.TypedParam("value") value: "a" | "b" | 1): void {
        value;
    }
}
