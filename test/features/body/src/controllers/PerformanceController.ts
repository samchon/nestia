import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { IPerformance } from "@api/lib/structures/IPerformance";

@Controller("performance")
export class PerformanceController {
    /**
     * Get server performance info.
     * 
     * @returns Performance info
     * @warning This route is only for testing purposes
     * @reference https://nodejs.org/api/process.html#processmemoryusage
     * @tag system
     * @tag performance
     * @author Samchon
     */
    @core.TypedRoute.Get()
    public async get(): Promise<IPerformance> {
        return {
            cpu: process.cpuUsage(),
            memory: process.memoryUsage(),
            resource: process.resourceUsage(),
        };
    }
}
