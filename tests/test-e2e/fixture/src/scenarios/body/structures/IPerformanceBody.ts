/**
 * Performance info.
 *
 * @author Samchon
 */
export interface IPerformanceBody {
  cpu: NodeJS.CpuUsage;
  memory: NodeJS.MemoryUsage;
  resource: NodeJS.ResourceUsage;
}
