import { createPerformanceBenchmarkProgram } from "../createPerformanceBenchmarkProgram";

createPerformanceBenchmarkProgram(
  __dirname +
    "/../servers/nestia-express/benchmark-performance-nestia-express-ObjectHierarchical" +
    __filename.substr(-3),
);
