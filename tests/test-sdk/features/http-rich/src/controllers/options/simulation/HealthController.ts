import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/options/simulation/health")
export class SimulationHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
