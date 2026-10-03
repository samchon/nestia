/**
 * Performance info.
 *
 * @author Samchon
 */
export interface IAllMethodPerformance {
  cpu: NodeJS.CpuUsage;
  memory: NodeJS.MemoryUsage;
  resource: NodeJS.ResourceUsage;
}
