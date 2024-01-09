import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("invalid")
export class InvalidRouteController {
  @core.TypedRoute.Get("::id")
  public get(@core.TypedParam("id") id: string): void {
    id;
  }
}
