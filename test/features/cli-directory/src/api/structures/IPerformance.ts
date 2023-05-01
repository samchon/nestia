/**
 * Performance info.
 *
 * @author Samchon
 */
export interface IPerformance {
    cpu: NodeJS.CpuUsage;
    memory: NodeJS.MemoryUsage;
    resource: NodeJS.ResourceUsage;
}
