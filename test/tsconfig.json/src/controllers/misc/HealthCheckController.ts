import * as helper from "encrypted-nestjs";
import * as nest from "@nestjs/common";
import std from "tstl";

@nest.Controller("misc/health-check")
export class HealthCheckController
{
    @nest.Get()
    public get(): void
    {
    }

    @nest.Get("sleep-for/:ms")
    public async sleep_for
        (
            @helper.TypedParam("ms", "number") ms: number
        ): Promise<void>
    {
        await std.sleep_for(ms);
    }
}