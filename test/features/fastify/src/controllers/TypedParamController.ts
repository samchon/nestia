import { Controller } from "@nestjs/common";

import core from "@nestia/core";

@Controller("param")
export class TypedParamController {
    @core.TypedRoute.Get(":value/boolean")
    public boolean(@core.TypedParam("value") value: boolean): boolean {
        return value;
    }

    @core.TypedRoute.Get(":value/number")
    public number(@core.TypedParam("value") value: number): number {
        return value;
    }

    @core.TypedRoute.Get(":value/string")
    public string(@core.TypedParam("value") value: string): string {
        return value;
    }

    @core.TypedRoute.Get(":value/nullable")
    public nullable(
        @core.TypedParam("value") value: string | null,
    ): string | null {
        return value;
    }

    @core.TypedRoute.Get(":value/literal")
    public literal(
        @core.TypedParam("value") value: "A" | "B" | "C",
    ): "A" | "B" | "C" {
        return value;
    }
}
