import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IPerformance } from "../../structures/operation_id/IPerformance";

@Controller("http_rich/operation_id/performance")
export class OperationIdPerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<IPerformance> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
