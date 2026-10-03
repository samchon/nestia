/**
 * Performance info.
 *
 * @author Samchon
 */
export interface ExceptionFilterIPerformance {
  cpu: NodeJS.CpuUsage;
  memory: NodeJS.MemoryUsage;
  resource: NodeJS.ResourceUsage;
}
