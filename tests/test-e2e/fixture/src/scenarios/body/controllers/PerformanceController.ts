import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IPerformanceBody } from "../structures/IPerformanceBody";

@Controller("body/performance")
export class PerformanceController {
  /**
   * Get server performance info.
   *
   * @author Samchon
   * @returns Performance info
   * @warning This route is only for testing purposes
   * @reference https://nodejs.org/api/process.html#processmemoryusage
   * @tag system
   * @tag performance
   */
  @core.TypedRoute.Get()
  public async get(): Promise<IPerformanceBody> {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      resource: process.resourceUsage(),
    };
  }
}
