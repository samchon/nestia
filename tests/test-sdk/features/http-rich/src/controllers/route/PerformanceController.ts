import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IPerformance } from "../../structures/route/IPerformance";

@Controller("http_rich/route/performance")
export class RoutePerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<IPerformance> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
