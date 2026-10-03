/**
 * Performance info.
 *
 * @author Samchon
 */
export interface IRequestValidatePerformance {
  cpu: NodeJS.CpuUsage;
  memory: NodeJS.MemoryUsage;
  resource: NodeJS.ResourceUsage;
}
