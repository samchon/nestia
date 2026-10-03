import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/clone/common/performance")
export class CloneCommonPerformanceController {
  @core.TypedRoute.Get("cpu")
  public cpu(): NodeJS.CpuUsage {
    return process.cpuUsage();
  }

  @core.TypedRoute.Get("memory")
  public memory(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  @core.TypedRoute.Get("resource")
  public resource(): NodeJS.ResourceUsage {
    return process.resourceUsage();
  }
}
