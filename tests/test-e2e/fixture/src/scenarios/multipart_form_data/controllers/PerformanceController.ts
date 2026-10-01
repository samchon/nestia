import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IPerformanceMultipartFormData } from "../structures/IPerformanceMultipartFormData";

@Controller("multipart_form_data/performance")
export class PerformanceController {
  @core.TypedRoute.Get()
  public async get(): Promise<IPerformanceMultipartFormData> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
