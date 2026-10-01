import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IPerformanceMethod } from "../structures/IPerformanceMethod";

@Controller("method/performance")
export class PerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<IPerformanceMethod> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
