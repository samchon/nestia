import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { ExceptionFilterIPerformance } from "../../../structures/exception_filter/IPerformance";

@Controller("http_rich/exception_filter/performance")
export class ExceptionFilterPerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<ExceptionFilterIPerformance> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
