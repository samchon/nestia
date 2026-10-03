import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IPerformance } from "../../structures/method/IPerformance";

@Controller("http_rich/method/performance")
export class MethodPerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<IPerformance> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
