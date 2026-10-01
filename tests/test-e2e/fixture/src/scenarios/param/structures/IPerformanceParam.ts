/**
 * Performance info.
 *
 * @author Samchon
 */
export interface IPerformanceParam {
  cpu: NodeJS.CpuUsage;
  memory: NodeJS.MemoryUsage;
  resource: NodeJS.ResourceUsage;
}
