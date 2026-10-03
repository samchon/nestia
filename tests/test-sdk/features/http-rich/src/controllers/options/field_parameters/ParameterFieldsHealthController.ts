import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/options/field_parameters/param/health")
export class ParameterFieldsHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
