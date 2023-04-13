import * as nest from "@nestjs/common";

@nest.Controller()
export class StatusController {
    @nest.HttpCode(300)
    @nest.Get("status")
    public status(): number {
        return 300;
    }
}
