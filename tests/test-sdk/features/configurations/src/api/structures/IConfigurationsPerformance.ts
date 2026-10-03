/**
 * Performance info.
 *
 * @author Samchon
 */
export interface IConfigurationsPerformance {
  cpu: NodeJS.CpuUsage;
  memory: NodeJS.MemoryUsage;
  resource: NodeJS.ResourceUsage;
}
