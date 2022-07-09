import * as nest from "@nestjs/common";

@nest.Controller(["health", "healthy"])
export class HealthController {
    @nest.Get(["check", "alive"])
    public check(): void {}
}
