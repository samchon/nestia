import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { PropagationIPerformance } from "../../../structures/propagation/PropagationIPerformance";

@Controller("http_rich/options/propagation/performance")
export class PropagationPerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<PropagationIPerformance> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
