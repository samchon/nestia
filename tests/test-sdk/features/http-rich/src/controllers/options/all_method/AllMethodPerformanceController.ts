import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IAllMethodPerformance } from "../../../structures/options/all_method/IAllMethodPerformance";

@Controller("http_rich/options/all_method/performance")
export class AllMethodPerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<IAllMethodPerformance> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
