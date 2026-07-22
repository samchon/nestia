import os from "os";

export namespace BenchmarkWorker {
  export const count = (): number => workers(physicalCpuCount());

  export const workers = (processors: number): number =>
    Math.max(0, Math.min(2, processors - 2));

  export const physicalCpuCount = (
    loader: () => number = loadPhysicalCpuCount,
  ): number => {
    try {
      return loader();
    } catch {
      return os.availableParallelism();
    }
  };

  const loadPhysicalCpuCount = (): number =>
    require("physical-cpu-count") as number;
}
