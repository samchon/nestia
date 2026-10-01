import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IPerformancePlain } from "../structures/IPerformancePlain";

@Controller("plain/performance")
export class PerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<IPerformancePlain> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
