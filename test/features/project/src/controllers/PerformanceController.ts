import { Controller, Get } from "@nestjs/common";

import { IPerformance } from "@api/lib/structures/IPerformance";

@Controller("performance")
export class PerformanceController {
    @Get()
    public async get(): Promise<IPerformance> {
        return {
            cpu: process.cpuUsage(),
            memory: process.memoryUsage(),
            resource: process.resourceUsage(),
        };
    }
}
