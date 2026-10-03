import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/options/socket_calculator/health")
export class SocketCalculatorHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
