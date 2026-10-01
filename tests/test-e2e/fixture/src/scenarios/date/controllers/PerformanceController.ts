import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IPerformanceDate } from "../structures/IPerformanceDate";

@Controller("date/performance")
export class PerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<IPerformanceDate> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
