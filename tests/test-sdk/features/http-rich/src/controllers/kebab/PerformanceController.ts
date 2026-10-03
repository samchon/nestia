import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IPerformance } from "../../structures/kebab/IPerformance";

@Controller("http_rich/kebab/performance")
export class KebabPerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<IPerformance> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
