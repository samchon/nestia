import core from "@nestia/core";
import { ISwagger } from "@nestia/sdk/lib/structures/ISwagger";
import * as nest from "@nestjs/common";
import typia from "typia";

@nest.Controller("swagger")
export class SwaggerController {
    @core.TypedRoute.Get()
    public get(): ISwagger {
        return typia.random<ISwagger>();
    }
}
