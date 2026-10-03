import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IRequestValidatePerformance } from "../structures/IRequestValidatePerformance";

@Controller("http_rich/options/request_validate/performance")
export class RequestValidatePerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<IRequestValidatePerformance> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
