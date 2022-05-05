/**
 * Performance information of the backend server.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface IPerformance
{
    /**
     * CPU usage info.
     */
    cpu: NodeJS.CpuUsage;

    /**
     * Memory usage info.
     */
    memory: NodeJS.MemoryUsage;
}