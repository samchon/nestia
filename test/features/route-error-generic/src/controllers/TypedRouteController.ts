import { Controller } from "@nestjs/common";
import typia from "typia";

import core from "@nestia/core";

@Controller("route")
export class TypedRouteController {
    @core.TypedRoute.Get("random")
    public async random<T>(): Promise<ISomething<T>> {
        return typia.random<ISomething<number>>() as any;
    }
}

interface ISomething<T> {
    value: T;
}
