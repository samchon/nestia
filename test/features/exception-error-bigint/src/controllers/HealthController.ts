import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("health")
export class HealthController {
    @core.TypedException<bigint>(499)
    @core.TypedRoute.Get()
    public get(): void {}
}
