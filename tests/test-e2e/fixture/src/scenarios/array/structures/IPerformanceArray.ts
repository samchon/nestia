/**
 * Performance info.
 *
 * @author Samchon
 */
export interface IPerformanceArray {
  cpu: NodeJS.CpuUsage;
  memory: NodeJS.MemoryUsage;
  resource: NodeJS.ResourceUsage;
}
