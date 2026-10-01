import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IPerformanceParam } from "../structures/IPerformanceParam";

@Controller("param/performance")
export class PerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<IPerformanceParam> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
