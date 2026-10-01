import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("invalid")
export class InvalidRouteController {
  // a parameter without a name, which no router accepts (`::id` is
  // find-my-way's literal colon, so a valid path)
  @core.TypedRoute.Get(":")
  public get(@core.TypedParam("id") id: string): void {
    id;
  }
}
