import { Controller } from "@nestjs/common";

import core from "@nestia/core";

@Controller("body")
export class TypedBodyController {
    @core.TypedRoute.Get("generic")
    public async generic<T>(
        @core.TypedBody() input: ISomething<T>,
    ): Promise<ISomething<T>> {
        return input;
    }
}

interface ISomething<T> {
    value: T;
}
