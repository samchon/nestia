import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { MultipartIPerformance } from "../../../structures/customized/multipart/MultipartIPerformance";

@Controller("http_rich/options/customized/multipart_performance")
export class MultipartPerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<MultipartIPerformance> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
