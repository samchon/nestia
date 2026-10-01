import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IPerformanceHeaders } from "../structures/IPerformanceHeaders";

@Controller("headers/performance")
export class PerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<IPerformanceHeaders> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
