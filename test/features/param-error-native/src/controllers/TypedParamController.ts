import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("param")
export class TypedParamController {
  @core.TypedRoute.Get(":value")
  public param(@core.TypedParam("value") value: Uint8Array): void {
    value;
  }
}
