import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IgnoreIPerformance } from "../../../structures/customized/ignore/IgnoreIPerformance";

@Controller("http_rich/options/customized/ignore_performance")
export class IgnorePerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<IgnoreIPerformance> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
