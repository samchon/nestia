import * as nest from "@nestjs/common";
import * as helper from "encrypted-nestjs";
import { IPerformance } from "../../../api/structures/performance/IMemoryUsage";

@nest.Controller("performance")
export class PerformanceController
{
    /**
     * Get performance information of the server.
     * 
     * @return Performance information
     */
    @helper.EncryptedRoute.Get()
    public get(): IPerformance
    {
        return {
            cpu: process.cpuUsage(),
            memory: process.memoryUsage()
        };
    }
}