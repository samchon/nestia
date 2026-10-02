import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/operation_id/health")
export class OperationIdHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
