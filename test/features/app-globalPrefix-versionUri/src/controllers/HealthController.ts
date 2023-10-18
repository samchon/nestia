import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller({
    path: "health",
    version: "1",
})
export class HealthController {
    @core.TypedRoute.Get()
    public get(): void {}
}
