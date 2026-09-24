import core from "@nestia/core";
import { Controller, Param } from "@nestjs/common";

/** A controller whose only path is a wildcard. */
@Controller("assets/*rest")
export class WildcardController {
  @core.TypedRoute.Get()
  public get(@Param("rest") rest: string[]): string {
    return rest.join(",");
  }
}
