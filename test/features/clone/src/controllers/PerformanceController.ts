import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("performance")
export class PerformanceController {
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
