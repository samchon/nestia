/**
 * Performance info.
 *
 * @author Samchon
 */
export interface IPerformanceDate {
  cpu: NodeJS.CpuUsage;
  memory: NodeJS.MemoryUsage;
  resource: NodeJS.ResourceUsage;
}
