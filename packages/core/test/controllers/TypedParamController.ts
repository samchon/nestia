import { TypedParam } from "@nestia/core";
import { Controller, Get } from "@nestjs/common";

const str = "string" as const;

@Controller("typed")
export class TypedParamController {
    @Get("auto/:p1")
    public auto(@TypedParam("p1") p1: string): void {
        p1;
    }

    @Get("type/:p1")
    public type(@TypedParam("p1", str) p1: string | null): void {
        p1;
    }

    @Get("nullable/:p1")
    public nullable(@TypedParam("p1", str, true) p1: string | null): void {
        p1;
    }
}
