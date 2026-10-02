import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("health")
export class HealthController {
  /**
   * Health check API.
   *
   * Just for health checking API liveness.
   *
   * @author Samchon
   * @tag system
   * @tag health
   */
  @core.TypedRoute.Get()
  public get(): void {}
}
