/**
 * Performance info.
 *
 * @author Samchon
 */
export interface IPerformanceHeaders {
  cpu: NodeJS.CpuUsage;
  memory: NodeJS.MemoryUsage;
  resource: NodeJS.ResourceUsage;
}
