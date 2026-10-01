import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IPerformanceRoute } from "../structures/IPerformanceRoute";

@Controller("route/performance")
export class PerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<IPerformanceRoute> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
