/**
 * Performance info.
 *
 * @author Samchon
 */
export interface IParameterFieldsPerformance {
  cpu: NodeJS.CpuUsage;
  memory: NodeJS.MemoryUsage;
  resource: NodeJS.ResourceUsage;
}
