import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/** Supplies the stateless PATCH workload for the shared benchmark workers. */
@Controller("benchmark")
export class BenchmarkController {
  /** Returns an authored literal after the transport monitor permits dispatch. */
  @core.TypedRoute.Patch("count")
  public count(): number {
    return 1;
  }
}
