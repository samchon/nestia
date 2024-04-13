import { createPerformanceBenchmarkProgram } from "../createPerformanceBenchmarkProgram";

createPerformanceBenchmarkProgram(
  __dirname +
    "/../servers/nestia-express/benchmark-performance-nestia-express-ArrayHierarchical" +
    __filename.substr(-3),
);
