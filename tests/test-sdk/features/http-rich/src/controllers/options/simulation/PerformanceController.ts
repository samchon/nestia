import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { SimulationIPerformance } from "../../../structures/simulation/SimulationIPerformance";

@Controller("http_rich/options/simulation/performance")
export class SimulationPerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<SimulationIPerformance> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
