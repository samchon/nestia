import { Controller } from "@nestjs/common";

import core from "@nestia/core";

@Controller("health")
export class HealthController {
    @core.TypedRoute.Get()
    public get(): void {}
}
