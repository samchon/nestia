import core from "@nestia/core";
import * as nest from "@nestjs/common";

@nest.Controller()
export class StatusController {
    @nest.HttpCode(300)
    @core.TypedRoute.Get("status")
    public status(): number {
        return 300;
    }
}
