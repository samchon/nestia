import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("body")
export class BodyController {
    @core.TypedRoute.Post("bigint")
    public bigint(@core.TypedBody() value: bigint): number {
        return Number(value);
    }
}
