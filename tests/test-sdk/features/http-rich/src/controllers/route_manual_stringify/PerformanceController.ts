import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IPerformance } from "../../structures/route_manual_stringify/IPerformance";

@Controller("http_rich/route_manual_stringify/performance")
export class RouteManualStringifyPerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<IPerformance> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
