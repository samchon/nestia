/**
 * Performance info.
 *
 * @author Samchon
 */
export interface SimulationIPerformance {
  cpu: NodeJS.CpuUsage;
  memory: NodeJS.MemoryUsage;
  resource: NodeJS.ResourceUsage;
}
