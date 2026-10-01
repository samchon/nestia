/**
 * Performance info.
 *
 * @author Samchon
 */
export interface IPerformanceRoute {
  cpu: NodeJS.CpuUsage;
  memory: NodeJS.MemoryUsage;
  resource: NodeJS.ResourceUsage;
}
