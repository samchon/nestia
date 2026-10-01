/**
 * Performance info.
 *
 * @author Samchon
 */
export interface IPerformancePlain {
  cpu: NodeJS.CpuUsage;
  memory: NodeJS.MemoryUsage;
  resource: NodeJS.ResourceUsage;
}
